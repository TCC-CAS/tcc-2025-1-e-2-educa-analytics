"""
Serviço de autenticação com JWT simples (HMAC-SHA256).
Não requer bibliotecas externas além do Python padrão.
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
from app.src.core.config import Config
from app.src.models.models import UsuarioModel, LoginModel, EducadorModel


def validar_recaptcha(token: str) -> bool:
    """
    Valida o token do reCAPTCHA com a API do Google.
    Retorna True se válido, False caso contrário.
    """
    # Se reCAPTCHA está desabilitado, retorna True
    if not Config.RECAPTCHA_ENABLED():
        print("[auth_service] reCAPTCHA desabilitado, pulando validação")
        return True
    
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
    """SHA-256 da senha. Em produção, use bcrypt via Lambda Layer."""
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


def login(email: str, senha: str) -> dict | None:
    """
    Autentica o usuário e retorna token + dados.
    Busca na tabela Login e retorna dados do Educador.
    Retorna None se as credenciais forem inválidas.
    """
    # Buscar na tabela Login
    login_data = LoginModel.find_by_email(email)
    if not login_data:
        print(f"[auth_service] Login não encontrado para email: {email}")
        return None
    
    # Verificar se a senha foi definida
    senha_definida = login_data.get("senha_definida", 0)
    if senha_definida == 0:
        print(f"[auth_service] Senha não definida para email: {email}")
        return None
    
    # Validar senha
    senha_hash = login_data.get("senha", "")
    if senha_hash != _hash_senha(senha):
        print(f"[auth_service] Senha inválida para email: {email}")
        return None
    
    # Buscar dados do educador
    id_matricula = login_data.get("idMatricula")
    educador = EducadorModel.find_by_matricula(id_matricula)
    
    if not educador:
        print(f"[auth_service] Educador não encontrado para matrícula: {id_matricula}")
        return None
    
    # Gerar token
    usuario = {
        "id": id_matricula,
        "nome": educador.get("nomeCompleto", ""),
        "email": email,
        "perfil": educador.get("tipoUsuario", "educador"),
    }
    
    token = _gerar_token(usuario)
    
    return {
        "token": token,
        "usuario": {
            "id": id_matricula,
            "nome": usuario["nome"],
            "email": email,
            "tipo": usuario["perfil"],
        },
    }


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
    Retorna {"valido": True/False, "expired": True/False}
    """
    print(f"[auth_service] Validando token para matrícula: {id_matricula}")
    print(f"[auth_service] Token recebido: {token[:20]}...")
    
    query = """
        SELECT token_criacao_senha, token_expiracao, senha_definida
        FROM Login
        WHERE idMatricula = %s
        LIMIT 1
    """
    
    try:
        rows = execute_query(query, (id_matricula,))
    except Exception as e:
        print(f"[auth_service] ERRO na query: {e}")
        return {"valido": False, "expired": False, "error": f"Erro no banco: {str(e)}"}
    
    if not rows:
        print(f"[auth_service] Usuário não encontrado: {id_matricula}")
        return {"valido": False, "expired": False, "error": "Usuário não encontrado"}
    
    row = rows[0]
    token_db = row.get("token_criacao_senha")
    expiracao_str = row.get("token_expiracao")
    senha_definida = row.get("senha_definida", 0)
    
    print(f"[auth_service] Token no DB: {token_db[:20] if token_db else 'NULL'}...")
    print(f"[auth_service] Expiração: {expiracao_str}")
    print(f"[auth_service] Senha definida: {senha_definida}")
    
    # Token já utilizado
    if senha_definida == 1:
        print(f"[auth_service] Token já utilizado")
        return {"valido": False, "expired": False, "error": "Token já utilizado"}
    
    # Token não existe no banco
    if not token_db:
        print(f"[auth_service] Token não existe no banco")
        return {"valido": False, "expired": False, "error": "Token não encontrado. Execute: python backend/scripts/add_token_columns.py"}
    
    # Token não corresponde
    if token != token_db:
        print(f"[auth_service] Token não corresponde")
        return {"valido": False, "expired": False, "error": "Token inválido"}
    
    # Verifica expiração
    if expiracao_str:
        try:
            # Se já é um datetime, usa direto; senão, faz parse
            if isinstance(expiracao_str, datetime):
                expiracao = expiracao_str
            else:
                expiracao = datetime.strptime(str(expiracao_str), "%Y-%m-%d %H:%M:%S")
            
            agora = datetime.utcnow()
            print(f"[auth_service] Expiracao: {expiracao}, Agora: {agora}")
            if agora > expiracao:
                print(f"[auth_service] Token expirado")
                return {"valido": False, "expired": True, "error": "Token expirado"}
        except ValueError as e:
            print(f"[auth_service] Erro ao parsear data: {e}")
    
    print(f"[auth_service] Token válido!")
    return {"valido": True, "expired": False}


def criar_senha_usuario(token: str, id_matricula: str, senha: str) -> dict:
    """
    Cria/atualiza a senha do usuário após validar o token.
    """
    # Validar token primeiro
    validacao = validar_token_senha(token, id_matricula)
    if not validacao.get("valido"):
        raise ValueError(validacao.get("error", "Token inválido"))
    
    # Hash da senha
    senha_hash = hashlib.sha256(senha.encode()).hexdigest()
    
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
    
    return {"sucesso": True, "mensagem": "Senha criada com sucesso"}
