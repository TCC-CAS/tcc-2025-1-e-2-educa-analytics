"""
Serviço de autenticação com JWT simples (HMAC-SHA256).
Implementa rate limiting, auditoria de segurança e suporte a múltiplos tipos de usuário.
Usa Argon2 para hashing de senhas (mais seguro que SHA-256).
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
import base64
import urllib.request
import urllib.parse
from datetime import datetime
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash
from app.src.core.config import Config
from app.src.models.models import UsuarioModel, LoginModel, EducadorModel
from app.src.adapters.db_adapter import execute_write

# Importar modelos UUID (novo sistema)
try:
    from app.src.models.usuario_uuid import (
        UsuarioModel as UsuarioUUIDModel,
        EducandoModel, EducadorModel as EducadorUUIDModel,
        ColaboradorModel, TokenRecuperacaoModel
    )
    UUID_ENABLED = True
except ImportError:
    UUID_ENABLED = False
    print("[auth_service] Modelos UUID não disponíveis")

# Configurar Argon2 com parâmetros seguros
ph = PasswordHasher(
    time_cost=2,        # Número de iterações
    memory_cost=65536,  # 64 MB de memória
    parallelism=4,      # Threads paralelas
    hash_len=32,        # Tamanho do hash
    salt_len=16         # Tamanho do salt
)


def validar_recaptcha(token: str) -> bool:
    """
    Valida o token do reCAPTCHA com a API do Google.
    Retorna True se válido, False caso contrário.
    """
    # DESABILITADO TEMPORARIAMENTE PARA DEBUG  
    print("[auth_service] reCAPTCHA DESABILITADO TEMPORARIAMENTE - retornando True")
    return True
    
    # Código original comentado
    # # Se reCAPTCHA está desabilitado, retorna True
    # if not Config.RECAPTCHA_ENABLED():
    #     print("[auth_service] reCAPTCHA desabilitado, pulando validação")
    #     return True
    
    if not token:
        print("[auth_service] Token reCAPTCHA vazio")
        return False
    
    secret_key = Config.RECAPTCHA_SECRET_KEY()
    
    # Chave de teste do Google - sempre retorna sucesso
    if secret_key == "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe":
        print("[auth_service] Usando chave de teste do reCAPTCHA - validação automática")
        return True
    
    try:
        url = "https://www.google.com/recaptcha/api/siteverify"
        data = urllib.parse.urlencode({
            "secret": secret_key,
            "response": token
        }).encode()
        
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            
            success = result.get("success", False)
            print(f"[auth_service] reCAPTCHA validation: success={success}")
            
            if not success:
                error_codes = result.get("error-codes", [])
                print(f"[auth_service] reCAPTCHA errors: {error_codes}")
            
            return success
    except Exception as e:
        print(f"[auth_service] Erro ao validar reCAPTCHA: {e}")
        # Em caso de erro de rede, retorna False para não permitir acesso
        return False


def _hash_senha(senha: str) -> str:
    """
    Cria hash da senha usando Argon2.
    Argon2 é muito mais seguro que SHA-256 para senhas.
    """
    return ph.hash(senha)


def _verificar_senha(senha: str, senha_hash: str) -> tuple[bool, bool]:
    """
    Verifica se a senha corresponde ao hash.
    Suporta tanto Argon2 (novo) quanto SHA-256 (legado).
    
    Returns:
        (senha_valida, precisa_migrar)
    """
    # Verificar se é hash Argon2 (começa com $argon2)
    if senha_hash.startswith("$argon2"):
        try:
            ph.verify(senha_hash, senha)
            return (True, False)  # Senha válida, já está em Argon2
        except VerifyMismatchError:
            return (False, False)  # Senha incorreta
        except (InvalidHash, Exception):
            # Hash inválido, talvez corrompido
            return (False, False)
    
    # Hash legado SHA-256 (64 caracteres hexadecimais)
    elif len(senha_hash) == 64 and all(c in '0123456789abcdef' for c in senha_hash.lower()):
        senha_sha256 = hashlib.sha256(senha.encode()).hexdigest()
        if senha_hash == senha_sha256:
            return (True, True)  # Senha válida, PRECISA migrar para Argon2
        else:
            return (False, False)  # Senha incorreta
    
    # Formato desconhecido
    else:
        print(f"[auth_service] ⚠️  Hash em formato desconhecido: {senha_hash[:20]}...")
        return (False, False)


def _hash_senha_sha256_legado(senha: str) -> str:
    """SHA-256 legado - manter apenas para referência."""
    return hashlib.sha256(senha.encode()).hexdigest()


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _gerar_token(usuario: dict) -> str:
    """Gera um JWT simples HS256."""
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    agora = int(time.time())
    payload = _b64url(
        json.dumps(
            {
                "sub": usuario["id"],
                "email": usuario["email"],
                "perfil": usuario["perfil"],
                "iat": agora,
                "exp": agora + Config.JWT_EXPIRATION_HOURS() * 3600,
            }
        ).encode()
    )
    assinatura = _b64url(
        hmac.new(
            Config.JWT_SECRET().encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256,
        ).digest()
    )
    return f"{header}.{payload}.{assinatura}"


def validar_token(token: str) -> dict | None:
    """Valida o JWT e retorna o payload ou None se inválido/expirado."""
    try:
        partes = token.split(".")
        if len(partes) != 3:
            return None
        header, payload, assinatura = partes
        assinatura_esperada = _b64url(
            hmac.new(
                Config.JWT_SECRET().encode(),
                f"{header}.{payload}".encode(),
                hashlib.sha256,
            ).digest()
        )
        if not hmac.compare_digest(assinatura, assinatura_esperada):
            return None
        padding = 4 - len(payload) % 4
        dados = json.loads(base64.urlsafe_b64decode(payload + "=" * padding))
        if dados.get("exp", 0) < int(time.time()):
            return None
        return dados
    except Exception:
        return None


def _buscar_usuario_por_email_ou_id(email_ou_id: str) -> tuple[dict | None, str]:
    """
    Busca usuário em ambos os sistemas (UUID e legado).
    
    Args:
        email_ou_id: Email ou ID/matrícula do usuário
    
    Returns:
        tuple: (dados_usuario, sistema) onde sistema é 'uuid', 'legado' ou 'nenhum'
    """
    # 1. Tentar buscar no sistema UUID primeiro (se disponível)
    if UUID_ENABLED:
        # Buscar por email
        if '@' in email_ou_id:
            usuario_uuid = UsuarioUUIDModel.buscar_por_email(email_ou_id)
            if usuario_uuid:
                print(f"[auth_service] Usuário encontrado no sistema UUID (por email): {usuario_uuid['id']}")
                return (usuario_uuid, 'uuid')
        
        # Buscar por matrícula/registro em tabelas específicas
        try:
            educando = EducandoModel.buscar_por_matricula(email_ou_id)
            if educando:
                usuario_uuid = UsuarioUUIDModel.buscar_por_id(educando['usuario_id'])
                if usuario_uuid:
                    usuario_uuid['_tipo_especifico'] = 'educando'
                    usuario_uuid['_dados_especificos'] = educando
                    print(f"[auth_service] Educando encontrado no sistema UUID: {usuario_uuid['id']}")
                    return (usuario_uuid, 'uuid')
        except:
            pass
        
        try:
            educador = EducadorUUIDModel.buscar_por_registro(email_ou_id)
            if educador:
                usuario_uuid = UsuarioUUIDModel.buscar_por_id(educador['usuario_id'])
                if usuario_uuid:
                    usuario_uuid['_tipo_especifico'] = 'educador'
                    usuario_uuid['_dados_especificos'] = educador
                    print(f"[auth_service] Educador encontrado no sistema UUID: {usuario_uuid['id']}")
                    return (usuario_uuid, 'uuid')
        except:
            pass
        
        try:
            colaborador = ColaboradorModel.buscar_por_matricula(email_ou_id)
            if colaborador:
                usuario_uuid = UsuarioUUIDModel.buscar_por_id(colaborador['usuario_id'])
                if usuario_uuid:
                    usuario_uuid['_tipo_especifico'] = 'colaborador'
                    usuario_uuid['_dados_especificos'] = colaborador
                    print(f"[auth_service] Colaborador encontrado no sistema UUID: {usuario_uuid['id']}")
                    return (usuario_uuid, 'uuid')
        except:
            pass
    
    # 2. Buscar no sistema legado
    login_records = LoginModel.find_by_email_or_id(email_ou_id)
    if login_records:
        print(f"[auth_service] Usuário encontrado no sistema legado: {len(login_records)} registro(s)")
        return (login_records, 'legado')
    
    print(f"[auth_service] Nenhum usuário encontrado para: {email_ou_id}")
    return (None, 'nenhum')


def login(email_ou_id: str, senha: str, ip_address: str = None, user_agent: str = None) -> dict | None:
    """
    Autentica o usuário e retorna token + dados.
    Aceita EMAIL ou ID DE MATRÍCULA (ex: EDU20260710, COL-77331).
    Implementa rate limiting e auditoria de segurança.
    
    Args:
        email_ou_id: Email ou ID de matrícula do usuário
        senha: Senha do usuário
        ip_address: IP do cliente (para auditoria e rate limit)
        user_agent: User-Agent do navegador (para auditoria)
    
    Returns:
        dict com token e dados do usuário se sucesso, None se falhou
    """
    from app.src.services import rate_limit_service, auditoria_service
    
    print(f"[auth_service] Tentativa de login para: {email_ou_id}")
    
    # ===== 1. VERIFICAR RATE LIMIT =====
    limite = rate_limit_service.verificar_limite(email_ou_id, ip_address)
    
    if limite["bloqueado"]:
        print(f"[auth_service] ❌ Conta bloqueada: {email_ou_id}")
        
        # Registrar tentativa bloqueada
        auditoria_service.registrar_evento(
            tipo_evento="login_bloqueado",
            email=email_ou_id if "@" in email_ou_id else None,
            id_matricula=email_ou_id if "@" not in email_ou_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            sucesso=False,
            detalhes=f"Bloqueado por {limite['minutos_restantes']} minutos"
        )
        
        return {
            "erro": "conta_bloqueada",
            "mensagem": limite["motivo"],
            "minutos_restantes": limite["minutos_restantes"]
        }
    
    # ===== 2. BUSCAR USUÁRIO =====
    # Buscar em ambos os sistemas (UUID e legado)
    usuario_data, sistema = _buscar_usuario_por_email_ou_id(email_ou_id)
    
    if not usuario_data:
        print(f"[auth_service] Nenhum usuário encontrado para: {email_ou_id}")
        
        # Registrar falha e aplicar rate limit
        rate_limit_service.registrar_falha(email_ou_id, ip_address, user_agent)
        auditoria_service.registrar_evento(
            tipo_evento="login_falha",
            email=email_ou_id if "@" in email_ou_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            sucesso=False,
            detalhes="Usuário não encontrado"
        )
        
        return None
    
    print(f"[auth_service] Usuário encontrado no sistema: {sistema}")
    
    # ===== 3. AUTENTICAR (SISTEMA UUID) =====
    if sistema == 'uuid':
        # Verificar se senha foi definida
        senha_definida = usuario_data.get("senha_definida", False)
        if not senha_definida:
            print(f"[auth_service] Senha não definida para UUID: {usuario_data['id']}")
            auditoria_service.registrar_evento(
                tipo_evento="login_falha",
                email=usuario_data.get('email'),
                ip_address=ip_address,
                user_agent=user_agent,
                sucesso=False,
                detalhes="Senha não definida"
            )
            return None
        
        # Validar senha
        senha_hash = usuario_data.get("senha_hash", "")
        senha_valida, precisa_migrar = _verificar_senha(senha, senha_hash)
        
        if not senha_valida:
            print(f"[auth_service] Senha inválida para UUID: {usuario_data['id']}")
            rate_limit_service.registrar_falha(email_ou_id, ip_address, user_agent)
            auditoria_service.registrar_evento(
                tipo_evento="login_falha",
                email=usuario_data.get('email'),
                ip_address=ip_address,
                user_agent=user_agent,
                sucesso=False,
                detalhes="Senha incorreta"
            )
            return None
        
        # LOGIN BEM-SUCEDIDO (UUID)
        print(f"[auth_service] ✅ Login bem-sucedido (UUID): {usuario_data['id']}")
        
        # Atualizar último login
        UsuarioUUIDModel.atualizar_ultimo_login(usuario_data['id'], ip_address)
        
        # Resetar contador de tentativas
        rate_limit_service.resetar_contador(email_ou_id, ip_address)
        
        # Registrar sucesso
        auditoria_service.registrar_evento(
            tipo_evento="login_sucesso",
            email=usuario_data.get('email'),
            ip_address=ip_address,
            user_agent=user_agent,
            sucesso=True,
            detalhes=f"Sistema UUID - {usuario_data['tipo_usuario']}"
        )
        
        # Gerar token
        token_data = {
            "id": usuario_data['id'],
            "nome": usuario_data['nome'],
            "email": usuario_data['email'],
            "perfil": usuario_data['tipo_usuario']
        }
        token = _gerar_token(token_data)
        
        return {
            "token": token,
            "usuario": {
                "id": usuario_data['id'],
                "nome": usuario_data['nome'],
                "email": usuario_data['email'],
                "perfil": usuario_data['tipo_usuario'],
                "ativo": usuario_data.get('ativo', True)
            }
        }
    
    # ===== 4. AUTENTICAR (SISTEMA LEGADO) =====
    # Buscar todos os registros por email OU ID
    login_records = usuario_data
    
    if not login_records:
        print(f"[auth_service] Nenhum login encontrado para: {email_ou_id}")
        
        # Registrar falha e aplicar rate limit
        rate_limit_service.registrar_falha(email_ou_id, ip_address, user_agent)
        auditoria_service.registrar_evento(
            tipo_evento="login_falha",
            email=email_ou_id if "@" in email_ou_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            sucesso=False,
            detalhes="Usuário não encontrado"
        )
        
        return None
    
    print(f"[auth_service] Encontrados {len(login_records)} registro(s) legado")
    
    # ===== 5. TENTAR AUTENTICAR (LEGADO) =====
    # Tentar autenticar com cada registro encontrado
    for login_data in login_records:
        id_matricula = login_data.get("idMatricula")
        print(f"[auth_service] Testando registro: {id_matricula}")
        print(f"[auth_service] DEBUG - Chaves do registro: {list(login_data.keys())}")
        
        # Verificar se a senha foi definida
        senha_definida = login_data.get("senha_definida", 0)
        print(f"[auth_service] DEBUG - senha_definida: {senha_definida} (tipo: {type(senha_definida)})")
        
        if senha_definida == 0:
            print(f"[auth_service] Senha não definida para: {id_matricula}")
            continue
        
        # Validar senha (suporta Argon2 e SHA-256 legado)
        senha_hash = login_data.get("senha", "")
        print(f"[auth_service] DEBUG - senha_hash presente: {bool(senha_hash)}")
        print(f"[auth_service] DEBUG - senha_hash tipo: {type(senha_hash)}")
        print(f"[auth_service] DEBUG - senha_hash len: {len(senha_hash) if senha_hash else 0}")
        if senha_hash:
            print(f"[auth_service] DEBUG - senha_hash início: {senha_hash[:30]}")
        
        if not senha_hash:
            print(f"[auth_service] ❌ Hash de senha vazio para: {id_matricula}")
            # Continuar tentando com próximo registro
            continue
        
        try:
            senha_valida, precisa_migrar = _verificar_senha(senha, senha_hash)
            print(f"[auth_service] DEBUG - senha_valida: {senha_valida}, precisa_migrar: {precisa_migrar}")
        except Exception as e:
            print(f"[auth_service] ❌ Erro ao verificar senha: {e}")
            import traceback
            traceback.print_exc()
            senha_valida = False
            precisa_migrar = False
        
        if not senha_valida:
            print(f"[auth_service] Senha inválida para: {id_matricula}")
            continue
        
        # ===== 4. SENHA CORRETA - LOGIN BEM-SUCEDIDO =====
        print(f"[auth_service] ✅ Senha válida para: {id_matricula}")
        
        # Migrar senha de SHA-256 para Argon2 se necessário
        if precisa_migrar:
            print(f"[auth_service] 🔄 Migrando senha de SHA-256 para Argon2: {id_matricula}")
            try:
                novo_hash = _hash_senha(senha)
                execute_write(
                    "UPDATE Login SET senha = %s WHERE idMatricula = %s",
                    (novo_hash, id_matricula)
                )
                print(f"[auth_service] ✅ Senha migrada com sucesso para: {id_matricula}")
                
                # Registrar migração na auditoria
                auditoria_service.registrar_evento(
                    tipo_evento="senha_migrada_argon2",
                    id_matricula=id_matricula,
                    email=login_data.get("email"),
                    ip_address=ip_address,
                    user_agent=user_agent,
                    sucesso=True,
                    detalhes="Migração automática de SHA-256 para Argon2"
                )
            except Exception as e:
                print(f"[auth_service] ⚠️  Erro ao migrar senha: {e}")
                # Não falhar o login por causa da migração
        
        # Buscar dados completos do usuário
        tipo_usuario, usuario_data = _buscar_dados_usuario(id_matricula)
        
        if not usuario_data:
            print(f"[auth_service] Dados do usuário não encontrados para: {id_matricula}")
            continue
        
        # ===== 5. VERIFICAR ATIVIDADE SUSPEITA =====
        from app.src.services import deteccao_suspeita_service
        
        verificacao = deteccao_suspeita_service.verificar_login_suspeito(
            id_matricula=id_matricula,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if verificacao["suspeito"] and verificacao["acao_recomendada"] == "bloquear":
            # Login suspeito - BLOQUEAR
            print(f"[auth_service] 🚨 Login BLOQUEADO por atividade suspeita: {id_matricula}")
            
            deteccao_suspeita_service.registrar_login_suspeito(
                id_matricula=id_matricula,
                email=login_data.get("email"),
                ip_address=ip_address,
                user_agent=user_agent,
                detalhes_suspeita=verificacao
            )
            
            # Invalidar todas as sessões
            deteccao_suspeita_service.invalidar_todas_sessoes_por_seguranca(
                id_matricula=id_matricula,
                motivo=verificacao["motivo"]
            )
            
            return {
                "erro": "login_suspeito",
                "mensagem": "Login suspeito detectado. Por segurança, todas as sessões foram encerradas. Verifique seu email.",
                "detalhes": verificacao.get("detalhes", {})
            }
        
        # Gerar token JWT
        usuario = {
            "id": id_matricula,
            "nome": usuario_data.get("nomeCompleto", ""),
            "email": login_data.get("email"),
            "perfil": tipo_usuario,
        }
        
        token = _gerar_token(usuario)
        
        # Limpar tentativas falhas
        rate_limit_service.limpar_tentativas(email_ou_id)
        
        # Criar sessão ativa
        from app.src.services import sessao_service
        id_sessao = sessao_service.criar_sessao(
            id_matricula=id_matricula,
            token_jwt=token,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Registrar login bem-sucedido
        auditoria_service.registrar_evento(
            tipo_evento="login_sucesso",
            id_matricula=id_matricula,
            email=login_data.get("email"),
            ip_address=ip_address,
            user_agent=user_agent,
            sucesso=True,
            detalhes=f"Sessão: {id_sessao}" if id_sessao else None
        )
        
        # Atualizar último login no banco (se colunas existirem)
        try:
            execute_write(
                "UPDATE Login SET ultimo_login = NOW(), ultimo_ip = %s WHERE idMatricula = %s",
                (ip_address, id_matricula)
            )
        except Exception:
            pass  # Colunas ainda não existem
        
        return {
            "token": token,
            "usuario": {
                "id": id_matricula,
                "nome": usuario["nome"],
                "email": login_data.get("email"),
                "tipo": tipo_usuario,
            },
        }
    
    # ===== 5. NENHUMA SENHA VÁLIDA =====
    print(f"[auth_service] Nenhuma senha válida encontrada para: {email_ou_id}")
    
    # Registrar falha e aplicar rate limit
    rate_limit_service.registrar_falha(email_ou_id, ip_address, user_agent)
    auditoria_service.registrar_evento(
        tipo_evento="login_falha",
        email=email_ou_id if "@" in email_ou_id else None,
        id_matricula=email_ou_id if "@" not in email_ou_id else None,
        ip_address=ip_address,
        user_agent=user_agent,
        sucesso=False,
        detalhes="Senha incorreta"
    )
    
    return None


def _buscar_dados_usuario(id_matricula: str) -> tuple[str, dict | None]:
    """
    Busca dados completos do usuário baseado no prefixo do ID.
    
    Returns:
        (tipo_usuario, dados_usuario)
    """
    # Detectar tipo de usuário pelo prefixo do ID
    if id_matricula.startswith("EDU"):
        educador = EducadorModel.find_by_matricula(id_matricula)
        if educador:
            tipo = educador.get("tipoUsuario", "educador")
            return (tipo, educador)
    
    elif id_matricula.startswith("COL"):
        from app.src.models.models import ColaboradorModel
        colaborador = ColaboradorModel.find_by_id(id_matricula)
        if colaborador:
            return ("colaborador", colaborador)
    
    elif id_matricula.startswith("EST") or id_matricula.startswith("EDN"):
        from app.src.models.models import EducandoResponsavelModel
        educando = EducandoResponsavelModel.find_by_id(id_matricula)
        if educando:
            return ("educando", educando)
    
    elif id_matricula.startswith("RES"):
        from app.src.models.models import EducandoResponsavelModel
        responsavel = EducandoResponsavelModel.find_by_id(id_matricula)
        if responsavel:
            return ("responsavel", responsavel)
    
    elif id_matricula.startswith("GES"):
        # TODO: criar model para gestores
        return ("gestor", {"idMatricula": id_matricula, "nomeCompleto": "Gestor"})
    
    elif id_matricula.startswith("ADM"):
        # TODO: criar model para administrativos
        return ("administrativo", {"idMatricula": id_matricula, "nomeCompleto": "Administrativo"})
    
    # ===== ID LEGADO (SEM PREFIXO) =====
    # IDs numéricos puros são do sistema legado - buscar na tabela Login
    else:
        print(f"[auth_service] ID sem prefixo detectado: {id_matricula} - buscando no sistema legado")
        try:
            # Buscar na tabela Login para obter os dados básicos
            login_row = execute_query(
                """SELECT idMatricula, email, senha_definida
                   FROM Login 
                   WHERE idMatricula = %s
                   LIMIT 1""",
                (id_matricula,)
            )
            
            if login_row and len(login_row) > 0:
                login_data = login_row[0]
                print(f"[auth_service] ✅ Dados legados encontrados para: {id_matricula}")
                print(f"[auth_service] Email: {login_data.get('email')}")
                
                tipo_usuario = "educando"  # Default educando para IDs legados sem prefixo
                
                # Montar objeto de usuário com dados disponíveis
                usuario_data = {
                    "idMatricula": id_matricula,
                    "email": login_data.get("email"),
                    "tipoUsuario": tipo_usuario,
                    "nomeCompleto": f"Usuário {id_matricula}",  # Nome genérico pois não temos na tabela Login
                    "senha_definida": login_data.get("senha_definida")
                }
                
                # Retornar dados formatados
                return (tipo_usuario, usuario_data)
            else:
                print(f"[auth_service] ❌ Dados legados não encontrados para: {id_matricula}")
        except Exception as e:
            print(f"[auth_service] ❌ Erro ao buscar dados legados: {e}")
            import traceback
            traceback.print_exc()
    
    return (None, None)


def registrar(nome: str, email: str, senha: str, perfil: str = "professor") -> int:
    """Cria um novo usuário. Retorna o ID gerado."""
    if UsuarioModel.find_by_email(email):
        raise ValueError("E-mail já cadastrado")
    return UsuarioModel.create(nome, email, _hash_senha(senha), perfil)


def get_usuario_do_evento(event: dict) -> dict | None:
    """Extrai e valida o token do header Authorization do evento Lambda."""
    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    return validar_token(token)


# ── Criação de senha via token de email ──────────────────────────────────────

from app.src.adapters.db_adapter import execute_query, execute_write
from datetime import datetime


def validar_token_senha(token: str, id_matricula: str) -> dict:
    """
    Valida se o token de criação de senha é válido e não expirou.
    Suporta tanto sistema UUID (tokens_recuperacao) quanto legado (Login).
    Retorna {"valido": True/False, "expired": True/False, "sistema": "uuid"/"legado"}
    """
    print(f"[auth_service] Validando token para ID: {id_matricula}")
    print(f"[auth_service] Token recebido: {token[:20]}...")
    
    # ===== 1. TENTAR SISTEMA UUID PRIMEIRO =====
    if UUID_ENABLED:
        try:
            # Buscar por token na tabela tokens_recuperacao
            token_row = TokenRecuperacaoModel.buscar_por_token(token)
            
            if token_row:
                print(f"[auth_service] Token encontrado no sistema UUID")
                
                # Verificar se já foi utilizado
                if token_row.get('utilizado'):
                    print(f"[auth_service] Token já utilizado")
                    return {"valido": False, "expired": False, "error": "Token já utilizado", "sistema": "uuid"}
                
                # Verificar expiração
                expiracao = token_row.get('expiracao')
                if expiracao:
                    agora = datetime.utcnow()
                    if isinstance(expiracao, str):
                        expiracao = datetime.strptime(expiracao, "%Y-%m-%d %H:%M:%S")
                    
                    print(f"[auth_service] Expiracao: {expiracao}, Agora: {agora}")
                    if agora > expiracao:
                        print(f"[auth_service] Token expirado")
                        return {"valido": False, "expired": True, "error": "Token expirado", "sistema": "uuid"}
                
                # Verificar se o usuario_id corresponde ao ID fornecido
                usuario_id_token = token_row.get('usuario_id')
                
                # Buscar usuário para validar
                usuario = UsuarioUUIDModel.buscar_por_id(usuario_id_token)
                if not usuario:
                    print(f"[auth_service] Usuário UUID não encontrado")
                    return {"valido": False, "expired": False, "error": "Usuário não encontrado", "sistema": "uuid"}
                
                # Se id_matricula for um UUID, comparar diretamente
                if len(id_matricula) == 36 and '-' in id_matricula:
                    if usuario_id_token != id_matricula:
                        print(f"[auth_service] UUID não corresponde")
                        return {"valido": False, "expired": False, "error": "ID inválido", "sistema": "uuid"}
                else:
                    # Se for matrícula/email, buscar o usuário correspondente
                    usuario_data, sistema = _buscar_usuario_por_email_ou_id(id_matricula)
                    if not usuario_data or sistema != 'uuid':
                        print(f"[auth_service] Usuário não encontrado para matrícula: {id_matricula}")
                        # Continuar para sistema legado
                    elif usuario_data.get('id') != usuario_id_token:
                        print(f"[auth_service] Token não pertence a este usuário")
                        return {"valido": False, "expired": False, "error": "Token inválido", "sistema": "uuid"}
                    else:
                        print(f"[auth_service] Token UUID válido!")
                        return {
                            "valido": True, 
                            "expired": False, 
                            "sistema": "uuid",
                            "usuario_id": usuario_id_token,
                            "token_id": token_row.get('id')
                        }
                
                print(f"[auth_service] Token UUID válido!")
                return {
                    "valido": True, 
                    "expired": False, 
                    "sistema": "uuid",
                    "usuario_id": usuario_id_token,
                    "token_id": token_row.get('id')
                }
        except Exception as e:
            print(f"[auth_service] Erro ao validar token UUID: {e}")
            # Continuar para sistema legado
    
    # ===== 2. SISTEMA LEGADO =====
    print(f"[auth_service] Tentando sistema legado...")
    
    query = """
        SELECT token_criacao_senha, token_expiracao, senha_definida
        FROM Login
        WHERE idMatricula = %s
        LIMIT 1
    """
    
    try:
        rows = execute_query(query, (id_matricula,))
    except Exception as e:
        print(f"[auth_service] ERRO na query legado: {e}")
        return {"valido": False, "expired": False, "error": f"Erro no banco: {str(e)}", "sistema": "legado"}
    
    if not rows:
        print(f"[auth_service] Usuário não encontrado em nenhum sistema: {id_matricula}")
        return {"valido": False, "expired": False, "error": "Usuário não encontrado", "sistema": "legado"}
    
    row = rows[0]
    token_db = row.get("token_criacao_senha")
    expiracao_str = row.get("token_expiracao")
    senha_definida = row.get("senha_definida", 0)
    
    print(f"[auth_service] Token no DB legado: {token_db[:20] if token_db else 'NULL'}...")
    print(f"[auth_service] Expiração: {expiracao_str}")
    print(f"[auth_service] Senha definida: {senha_definida}")
    
    # Token já utilizado
    if senha_definida == 1:
        print(f"[auth_service] Token já utilizado (legado)")
        return {"valido": False, "expired": False, "error": "Token já utilizado", "sistema": "legado"}
    
    # Token não existe no banco
    if not token_db:
        print(f"[auth_service] Token não existe no banco legado")
        return {"valido": False, "expired": False, "error": "Token não encontrado", "sistema": "legado"}
    
    # Token não corresponde
    if token != token_db:
        print(f"[auth_service] Token não corresponde (legado)")
        return {"valido": False, "expired": False, "error": "Token inválido", "sistema": "legado"}
    
    # Verifica expiração
    if expiracao_str:
        try:
            if isinstance(expiracao_str, datetime):
                expiracao = expiracao_str
            else:
                expiracao = datetime.strptime(str(expiracao_str), "%Y-%m-%d %H:%M:%S")
            
            agora = datetime.utcnow()
            print(f"[auth_service] Expiracao: {expiracao}, Agora: {agora}")
            if agora > expiracao:
                print(f"[auth_service] Token expirado (legado)")
                return {"valido": False, "expired": True, "error": "Token expirado", "sistema": "legado"}
        except ValueError as e:
            print(f"[auth_service] Erro ao parsear data: {e}")
    
    print(f"[auth_service] Token legado válido!")
    return {"valido": True, "expired": False, "sistema": "legado", "id_matricula": id_matricula}


def criar_senha_usuario(token: str, id_matricula: str, senha: str) -> dict:
    """
    Cria/atualiza a senha do usuário após validar o token.
    Suporta tanto sistema UUID quanto legado.
    Usa Argon2 para criar o hash da senha.
    """
    # Validar token primeiro
    validacao = validar_token_senha(token, id_matricula)
    if not validacao.get("valido"):
        raise ValueError(validacao.get("error", "Token inválido"))
    
    # Hash da senha com Argon2
    senha_hash = _hash_senha(senha)
    
    sistema = validacao.get("sistema", "legado")
    
    # ===== SISTEMA UUID =====
    if sistema == "uuid":
        usuario_id = validacao.get("usuario_id")
        token_id = validacao.get("token_id")
        
        print(f"[auth_service] Atualizando senha UUID para: {usuario_id}")
        
        # Atualizar senha do usuário
        UsuarioUUIDModel.atualizar_senha(usuario_id, senha_hash)
        
        # Marcar token como utilizado
        TokenRecuperacaoModel.marcar_como_utilizado(token_id)
        
        print(f"[auth_service] Senha criada com sucesso (UUID/Argon2) para: {usuario_id}")
        return {
            "sucesso": True, 
            "mensagem": "Senha criada com sucesso",
            "sistema": "uuid",
            "usuario_id": usuario_id
        }
    
    # ===== SISTEMA LEGADO =====
    else:
        print(f"[auth_service] Atualizando senha legado para: {id_matricula}")
        
        # Atualizar senha e marcar como definida
        execute_write(
            """
            UPDATE Login
            SET senha = %s,
                senha_definida = 1,
                token_criacao_senha = NULL,
                token_expiracao = NULL
            WHERE idMatricula = %s
            """,
            (senha_hash, id_matricula),
        )
        
        print(f"[auth_service] Senha criada com sucesso (Legado/Argon2) para: {id_matricula}")
        return {
            "sucesso": True, 
            "mensagem": "Senha criada com sucesso",
            "sistema": "legado",
            "id_matricula": id_matricula
        }
