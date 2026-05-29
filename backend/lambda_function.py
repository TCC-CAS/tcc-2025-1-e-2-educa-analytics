import json
import os
from dotenv import load_dotenv

print(f"[DEBUG ARQUIVO] lambda_function.py sendo carregado de: {__file__}")
import sys
sys.stdout.flush()

# Carrega o .env somente em desenvolvimento local (na Lambda as variáveis já
# estão definidas em Environment variables e load_dotenv não as sobrescreve)
load_dotenv(override=True)

from app.src.utils.router import Router
from app.src.utils.response import ok, created, error, not_found, unauthorized, server_error

# Importação dos services básicos (sem disciplinas, pois está corrompido)
import app.src.services.auth_service as auth_service
import app.src.services.alunos_service as alunos_service
import app.src.services.matricula_service as matricula_service
import app.src.services.colaborador_service as colaborador_service
import app.src.services.educador_service as educador_service
import app.src.services.fornecedor_service as fornecedor_service
import app.src.services.caixa_service as caixa_service
import app.src.services.turmas_service as turmas_service
import app.src.services.salas_service as salas_service
import app.src.services.educadores_service as educadores_service
import app.src.services.cronograma_service as cronograma_service
import app.src.services.instituicao_service as instituicao_service
# disciplinas_service - importado localmente em cada rota para evitar problemas de escopo

# Novos services para estrutura profissional de turmas
try:
    from app.src.services import series_service, periodos_service, anos_letivos_service, turma_service
    print(f"[DEBUG] Services importados com sucesso:")
    print(f"  - series_service: {series_service}")
    print(f"  - periodos_service: {periodos_service}")
    print(f"  - anos_letivos_service: {anos_letivos_service}")
    print(f"  - turma_service: {turma_service}")
except ImportError as e:
    print(f"[WARN] Services de turmas profissionais não disponíveis: {e}")
    series_service = periodos_service = anos_letivos_service = turma_service = None
# Services de "Minhas Turmas"
try:
    from app.src.services import frequencia_service, atividade_service, nota_service
except ImportError:
    print("[WARN] Serviços de Minhas Turmas não disponíveis")
    frequencia_service = atividade_service = nota_service = None
from app.src.models.models import DisciplinaModel, SalaModel

router = Router()


# ── Healthcheck ───────────────────────────────────────────────────────────────

@router.route("GET", "/")
def healthcheck(_event):
    return ok({"message": "educaAnalytics API online", "status": "ok"})


# ── Migração UUID (TEMPORÁRIO - REMOVER APÓS USO) ─────────────────────────────

@router.route("POST", "/admin/migrar-uuid")
def migrar_uuid(event):
    """
    Endpoint especial para executar a migração UUID.
    ⚠️  USAR APENAS UMA VEZ E DEPOIS REMOVER ESTE ENDPOINT!
    """
    try:
        body = json.loads(event.get("body") or "{}")
        senha_admin = body.get("senha_admin", "")
        
        # Senha de segurança básica (mudar antes de usar em produção!)
        if senha_admin != "migracao_uuid_2026":
            return unauthorized("Senha de administrador inválida")
        
        from app.src.services import migracao_service
        
        resultado = migracao_service.executar_migracao_uuid()
        
        if resultado["sucesso"]:
            return ok({
                "message": "Migração executada com sucesso!",
                **resultado
            })
        else:
            return error(f"Migração concluída com {resultado['erros']} erros", resultado)
    except Exception as e:
        return server_error(f"Erro ao executar migração: {str(e)}")


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.route("POST", "/auth/login")
def login(event):
    """Autentica usuário (email ou ID) e retorna token JWT"""
    print(f"[LOGIN ENDPOINT] ========== VERSÃO ATUALIZADA 2026-05-23 ==========")
    body = json.loads(event.get("body") or "{}")
    email_ou_id = body.get("email", "")  # Agora aceita email OU ID
    senha = body.get("senha", "") or body.get("password", "")
    captcha_token = body.get("captchaToken", "")
    
    print(f"[LOGIN] email_ou_id: {email_ou_id}, senha: {'*'*len(senha)}, captcha: {captcha_token[:10] if captcha_token else 'NONE'}...")
    
    if not email_ou_id or not senha:
        return error("email/ID e senha são obrigatórios")
    
    # Validar reCAPTCHA - DESABILITADO TEMPORARIAMENTE PARA DEBUG
    # if not auth_service.validar_recaptcha(captcha_token):
    #     return error("Falha na validação do reCAPTCHA. Por favor, tente novamente.")
    print(f"[login] reCAPTCHA validation DESABILITADO temporariamente")
    
    # Extrair IP e User-Agent do evento
    headers = event.get("headers") or {}
    ip_address = headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                 headers.get("X-Real-IP", "") or \
                 event.get("requestContext", {}).get("identity", {}).get("sourceIp", "")
    user_agent = headers.get("User-Agent", "")
    
    # Autenticar com rate limiting e auditoria
    resultado = auth_service.login(email_ou_id, senha, ip_address, user_agent)
    
    if not resultado:
        return unauthorized("Credenciais inválidas")
    
    # Verificar se é bloqueio por rate limit
    if resultado.get("erro") == "conta_bloqueada":
        return {
            "statusCode": 429,  # Too Many Requests
            "headers": {
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "erro": resultado["mensagem"],
                "minutos_restantes": resultado.get("minutos_restantes", 0)
            }, ensure_ascii=False),
        }
    
    return ok(resultado)


# ── Cadastro (Sistema UUID) ───────────────────────────────────────────────────

@router.route("POST", "/auth/cadastro/educando")
def cadastrar_educando_endpoint(event):
    """Cadastra um novo educando no sistema UUID"""
    try:
        from app.src.services import cadastro_service
        
        body = json.loads(event.get("body") or "{}")
        
        # Gerar matrícula automaticamente se não fornecida
        if not body.get('matricula'):
            body['matricula'] = cadastro_service.gerar_proxima_matricula('ALU')
        
        resultado = cadastro_service.cadastrar_educando(body)
        return created(resultado)
    
    except ValueError as e:
        return error(str(e))
    except Exception as e:
        print(f"[lambda] Erro ao cadastrar educando: {e}")
        import traceback
        traceback.print_exc()
        return server_error(f"Erro ao cadastrar educando: {str(e)}")


@router.route("POST", "/auth/cadastro/educador")
def cadastrar_educador_endpoint(event):
    """Cadastra um novo educador no sistema UUID"""
    try:
        from app.src.services import cadastro_service
        
        body = json.loads(event.get("body") or "{}")
        resultado = cadastro_service.cadastrar_educador(body)
        return created(resultado)
    
    except ValueError as e:
        return error(str(e))
    except Exception as e:
        print(f"[lambda] Erro ao cadastrar educador: {e}")
        import traceback
        traceback.print_exc()
        return server_error(f"Erro ao cadastrar educador: {str(e)}")


@router.route("POST", "/auth/cadastro/colaborador")
def cadastrar_colaborador_endpoint(event):
    """Cadastra um novo colaborador no sistema UUID"""
    try:
        from app.src.services import cadastro_service
        
        body = json.loads(event.get("body") or "{}")
        resultado = cadastro_service.cadastrar_colaborador(body)
        return created(resultado)
    
    except ValueError as e:
        return error(str(e))
    except Exception as e:
        print(f"[lambda] Erro ao cadastrar colaborador: {e}")
        import traceback
        traceback.print_exc()
        return server_error(f"Erro ao cadastrar colaborador: {str(e)}")


# ── Auth (Tokens e Recuperação) ───────────────────────────────────────────────

@router.route("GET", "/auth/validar-token")
def validar_token_senha(event):
    """Valida token de criação de senha enviado por email"""
    try:
        params = event.get("queryStringParameters") or {}
        token = params.get("token", "")
        id_matricula = params.get("id", "")
        
        if not token or not id_matricula:
            return error("token e id são obrigatórios")
        
        resultado = auth_service.validar_token_senha(token, id_matricula)
        
        if not resultado.get("valido"):
            if resultado.get("expired"):
                return error(resultado.get("error", "Token expirado"), code="EXPIRED")
            return error(resultado.get("error", "Token inválido"))
        
        return ok({"valido": True})
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/auth/criar-senha")
def criar_senha(event):
    """Cria a senha do usuário usando token do email"""
    try:
        body = json.loads(event.get("body") or "{}")
        token = body.get("token", "")
        id_matricula = body.get("id", "")
        senha = body.get("senha", "")
        
        if not token or not id_matricula or not senha:
            return error("token, id e senha são obrigatórios")
        
        resultado = auth_service.criar_senha_usuario(token, id_matricula, senha)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


# ── Sessões (Gerenciamento de Dispositivos) ──────────────────────────────────

@router.route("GET", "/auth/sessoes")
def listar_sessoes(event):
    """Lista dispositivos/sessões ativas do usuário autenticado"""
    try:
        from app.src.services import sessao_service
        
        # Obter usuário autenticado do token JWT
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")
        
        id_matricula = usuario.get("id")
        sessoes = sessao_service.listar_sessoes_usuario(id_matricula)
        
        return ok({"sessoes": sessoes, "total": len(sessoes)})
    except Exception as exc:
        return server_error(str(exc))


@router.route("DELETE", "/auth/sessoes/{idSessao}")
def encerrar_sessao(event):
    """Encerra uma sessão específica (logout remoto)"""
    try:
        from app.src.services import sessao_service
        
        # Obter usuário autenticado
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")
        
        id_matricula = usuario.get("id")
        id_sessao = event["pathParameters"]["idSessao"]
        
        sucesso = sessao_service.encerrar_sessao(id_matricula, id_sessao)
        
        if sucesso:
            return ok({"mensagem": "Sessão encerrada com sucesso"})
        else:
            return error("Sessão não encontrada ou não pertence ao usuário")
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/auth/sessoes/encerrar-todas")
def encerrar_todas_sessoes(event):
    """Encerra todas as sessões, exceto a atual"""
    try:
        from app.src.services import sessao_service
        
        # Obter usuário autenticado
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")
        
        id_matricula = usuario.get("id")
        
        # Extrair token atual (não encerrar esta sessão)
        headers = event.get("headers") or {}
        auth_header = headers.get("Authorization", "")
        token_atual = auth_header[7:] if auth_header.startswith("Bearer ") else None
        
        total = sessao_service.encerrar_todas_sessoes(id_matricula, exceto_token=token_atual)
        
        return ok({
            "mensagem": f"{total} sessões encerradas",
            "total_encerrado": total
        })
    except Exception as exc:
        return server_error(str(exc))


# ── OAuth (Google/Microsoft) ──────────────────────────────────────────────────

@router.route("GET", "/auth/oauth/google/url")
def oauth_google_url(_event):
    """Retorna URL para iniciar autenticação Google"""
    try:
        from app.src.services import oauth_service
        resultado = oauth_service.gerar_url_google()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/auth/oauth/google/callback")
def oauth_google_callback(event):
    """Processa callback do Google OAuth"""
    try:
        from app.src.services import oauth_service
        
        body = json.loads(event.get("body") or "{}")
        code = body.get("code", "")
        state = body.get("state", "")
        
        if not code:
            return error("Code é obrigatório")
        
        resultado = oauth_service.autenticar_google(code, state)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/auth/oauth/microsoft/url")
def oauth_microsoft_url(_event):
    """Retorna URL para iniciar autenticação Microsoft"""
    try:
        from app.src.services import oauth_service
        resultado = oauth_service.gerar_url_microsoft()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/auth/oauth/microsoft/callback")
def oauth_microsoft_callback(event):
    """Processa callback da Microsoft OAuth"""
    try:
        from app.src.services import oauth_service
        
        body = json.loads(event.get("body") or "{}")
        code = body.get("code", "")
        state = body.get("state", "")
        
        if not code:
            return error("Code é obrigatório")
        
        resultado = oauth_service.autenticar_microsoft(code, state)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


# ── Recuperação de Senha ──────────────────────────────────────────────────────

@router.route("POST", "/auth/esqueci-senha")
def esqueci_senha(event):
    """Solicita reset de senha via email"""
    try:
        from app.src.services import reset_senha_service
        
        body = json.loads(event.get("body") or "{}")
        email_ou_id = body.get("email", "") or body.get("id", "")
        
        if not email_ou_id:
            return error("Email ou ID é obrigatório")
        
        resultado = reset_senha_service.solicitar_reset_senha(email_ou_id)
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/auth/validar-reset-token")
def validar_reset_token(event):
    """Valida token de reset de senha"""
    try:
        from app.src.services import reset_senha_service
        
        params = event.get("queryStringParameters") or {}
        token = params.get("token", "")
        id_matricula = params.get("id", "")
        
        if not token or not id_matricula:
            return error("Token e ID são obrigatórios")
        
        resultado = reset_senha_service.validar_token_reset(token, id_matricula)
        
        if not resultado.get("valido"):
            if resultado.get("expired"):
                return error(resultado.get("error", "Token expirado"), code="EXPIRED")
            return error(resultado.get("error", "Token inválido"))
        
        return ok({"valido": True})
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/auth/resetar-senha")
def resetar_senha_route(event):
    """Redefine senha usando token"""
    try:
        from app.src.services import reset_senha_service
        
        body = json.loads(event.get("body") or "{}")
        token = body.get("token", "")
        id_matricula = body.get("id", "")
        nova_senha = body.get("senha", "")
        
        if not token or not id_matricula or not nova_senha:
            return error("Token, ID e senha são obrigatórios")
        
        resultado = reset_senha_service.resetar_senha(token, id_matricula, nova_senha)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


# ── CSRF Token ────────────────────────────────────────────────────────────────

@router.route("GET", "/auth/csrf-token")
def obter_csrf_token(event):
    """Retorna token CSRF para o usuário autenticado"""
    try:
        from app.src.services import security_middleware
        
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")
        
        csrf_token = security_middleware.gerar_csrf_token(usuario.get("id"))
        
        return ok({"csrf_token": csrf_token})
    except Exception as exc:
        return server_error(str(exc))


# ── Matrículas ────────────────────────────────────────────────────────────────

@router.route("POST", "/matricula")
def criar_matricula(event):
    try:
        resultado = matricula_service.criar_matricula(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, 'args', ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("GET", "/matricula")
def listar_matriculas(_event):
    try:
        return ok(matricula_service.listar_matriculas())
    except Exception as exc:
        args = getattr(exc, 'args', ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("PUT", "/matricula/{idMatricula}")
def atualizar_matricula(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        resultado = matricula_service.atualizar_matricula(id_matricula, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))


@router.route("PATCH", "/matricula/lote/status")
def atualizar_status_lote(event):
    try:
        body = json.loads(event.get("body") or "{}")
        ids        = body.get("ids", [])
        novo_status = body.get("status", "")
        total = matricula_service.atualizar_status_lote(ids, novo_status)
        return ok({"atualizados": total})
    except ValueError as exc:
        return error(str(exc))


@router.route("PATCH", "/matricula/{idMatricula}/status")
def atualizar_status(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        body = json.loads(event.get("body") or "{}")
        novo_status = body.get("status", "")
        matricula_service.atualizar_status(id_matricula, novo_status)
        return ok({"idMatricula": id_matricula, "status": novo_status})
    except ValueError as exc:
        return error(str(exc))


# ── Rotas específicas ANTES da rota com parâmetro ────────────────────────────

@router.route("GET", "/matricula/turmas")
def listar_turmas(event):
    qs = event.get("queryStringParameters") or {}
    turmas = matricula_service.listar_turmas(
        ano_letivo=qs.get("anoLetivo"),
        serie=qs.get("serie"),
        periodo=qs.get("periodo"),
    )
    return ok(turmas)


@router.route("GET", "/matricula/series")
def listar_series(event):
    qs = event.get("queryStringParameters") or {}
    ano_letivo = qs.get("anoLetivo", "")
    if not ano_letivo:
        return error("anoLetivo é obrigatório")
    return ok(matricula_service.listar_series(ano_letivo))


@router.route("GET", "/matricula/periodos")
def listar_periodos(event):
    qs = event.get("queryStringParameters") or {}
    ano_letivo = qs.get("anoLetivo", "")
    serie = qs.get("serie", "")
    if not ano_letivo or not serie:
        return error("anoLetivo e serie são obrigatórios")
    return ok(matricula_service.listar_periodos(ano_letivo, serie))


@router.route("GET", "/matricula/{idMatricula}")
def buscar_matricula(event):
    id_matricula = event["pathParameters"]["idMatricula"]
    resultado = matricula_service.buscar_matricula(id_matricula)
    if not resultado:
        return not_found(f"Matrícula {id_matricula} não encontrada")
    return ok(resultado)


@router.route("DELETE", "/matricula/{idMatricula}")
def excluir_matricula(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        resultado = matricula_service.excluir_matricula(id_matricula)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, 'args', ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


# ── Colaboradores ────────────────────────────────────────────────────────────

@router.route("GET", "/colaboradores/proxima-matricula")
def gerar_proxima_matricula_colaborador(event):
    """Gera a próxima matrícula funcional para colaboradores"""
    try:
        resultado = colaborador_service.gerar_proxima_matricula()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/colaboradores")
def listar_colaboradores(_event):
    try:
        return ok(colaborador_service.listar_colaboradores())
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/colaboradores")
def criar_colaborador(event):
    try:
        resultado = colaborador_service.criar_colaborador(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("PATCH", "/colaboradores/{idMatricula}/status")
def atualizar_status_colaborador(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        body = json.loads(event.get("body") or "{}")
        novo_status = body.get("status", "")
        resultado = colaborador_service.atualizar_status_colaborador(id_matricula, novo_status)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))


@router.route("GET", "/colaboradores/{idMatricula}")
def buscar_colaborador(event):
    id_matricula = event["pathParameters"]["idMatricula"]
    resultado = colaborador_service.buscar_colaborador(id_matricula)
    if not resultado:
        return not_found(f"Colaborador {id_matricula} não encontrado")
    return ok(resultado)


@router.route("PUT", "/colaboradores/{idMatricula}")
def atualizar_colaborador(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        resultado = colaborador_service.atualizar_colaborador(id_matricula, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("DELETE", "/colaboradores/{idMatricula}")
def excluir_colaborador(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        return ok(colaborador_service.excluir_colaborador(id_matricula))
    except ValueError as exc:
        return error(str(exc))


# ── Educadores ────────────────────────────────────────────────────────────────

@router.route("GET", "/educadores/proxima-matricula")
def gerar_proxima_matricula_educador(event):
    """Gera a próxima matrícula funcional para educadores"""
    try:
        resultado = educador_service.gerar_proxima_matricula()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/educadores")
def listar_educadores(event):
    """Lista todos os educadores cadastrados"""
    try:
        resultado = educador_service.listar_educadores()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/educadores")
def criar_educador(event):
    try:
        resultado = educador_service.criar_educador(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("GET", "/educadores/{idMatricula}")
def buscar_educador(event):
    id_matricula = event["pathParameters"]["idMatricula"]
    resultado = educador_service.buscar_educador(id_matricula)
    if not resultado:
        return not_found(f"Educador {id_matricula} não encontrado")
    return ok(resultado)


@router.route("PUT", "/educadores/{idMatricula}")
def atualizar_educador(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        resultado = educador_service.atualizar_educador(id_matricula, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("DELETE", "/educadores/{idMatricula}")
def excluir_educador(event):
    try:
        id_matricula = event["pathParameters"]["idMatricula"]
        resultado = educador_service.excluir_educador(id_matricula)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


# ── Instituições ──────────────────────────────────────────────────────────────

@router.route("GET", "/instituicoes/buscar")
def buscar_instituicoes(event):
    """Busca instituições de ensino por termo (autocomplete)"""
    try:
        query_params = event.get("queryStringParameters") or {}
        termo = query_params.get("q", "")
        limite = int(query_params.get("limite", 10))
        
        if not termo or len(termo.strip()) < 2:
            return error("Termo de busca deve ter no mínimo 2 caracteres")
        
        resultados = instituicao_service.buscar_instituicoes(termo, limite)
        return ok(resultados)
    
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/instituicoes")
def listar_instituicoes(event):
    """Lista instituições principais (para popular dropdown)"""
    try:
        query_params = event.get("queryStringParameters") or {}
        limite = int(query_params.get("limite", 50))
        
        resultados = instituicao_service.listar_todas(limite)
        return ok(resultados)
    
    except Exception as exc:
        return server_error(str(exc))


# ── Disciplinas ───────────────────────────────────────────────────────────────

print("[DEBUG MODULE LEVEL] Registrando rotas de disciplinas...")

@router.route("GET", "/disciplinas")
def listar_disciplinas_route(event):
    """Lista todas as disciplinas"""
    print("[DEBUG ROUTE CALLED] listar_disciplinas_route foi chamada!")
    
    # Teste: retornar dados hardcoded para ver se a rota funciona
    import sys
    sys.stdout.flush()
    
    try:
        from app.src.services import disciplinas_service as disc_svc
        print(f"[DEBUG IMPORT] disc_svc = {disc_svc}")
        sys.stdout.flush()
        
        query_params = event.get("queryStringParameters") or {}
        status = query_params.get("status")
        
        resultado = disc_svc.listar_disciplinas(status=status)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR listar_disciplinas_route] {exc}")
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        return error(f"Erro ao listar disciplinas: {str(exc)}", 500)


@router.route("GET", "/disciplinas/{id}")
def buscar_disciplina_route(event):
    """Busca uma disciplina específica por ID"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        id_disciplina = int(event["pathParameters"]["id"])
        resultado = disc_service.buscar_disciplina(id_disciplina)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 404)
    
    except ValueError:
        return error("ID da disciplina inválido", 400)
    except Exception as exc:
        print(f"[ERROR buscar_disciplina_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao buscar disciplina: {str(exc)}", 500)


@router.route("POST", "/disciplinas")
def criar_disciplina_route(event):
    """Cria uma nova disciplina"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        body = event.get("body", {})
        resultado = disc_service.criar_disciplina(body)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR criar_disciplina_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao criar disciplina: {str(exc)}", 500)


@router.route("PUT", "/disciplinas/{id}")
def atualizar_disciplina_route(event):
    """Atualiza uma disciplina existente"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        id_disciplina = int(event["pathParameters"]["id"])
        body = event.get("body", {})
        resultado = disc_service.atualizar_disciplina(id_disciplina, body)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except ValueError:
        return error("ID da disciplina inválido", 400)
    except Exception as exc:
        print(f"[ERROR atualizar_disciplina_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao atualizar disciplina: {str(exc)}", 500)


@router.route("DELETE", "/disciplinas/{id}")
def deletar_disciplina_route(event):
    """Deleta (inativa) uma disciplina"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        id_disciplina = int(event["pathParameters"]["id"])
        
        resultado = disc_service.deletar_disciplina(id_disciplina)
        
        if resultado["success"]:
            return ok({"message": resultado["message"]})
        else:
            return error(resultado["message"], 404 if "não encontrada" in resultado["message"] else 400)
    
    except ValueError:
        return error("ID da disciplina inválido", 400)
    except Exception as exc:
        print(f"[ERROR deletar_disciplina_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao deletar disciplina: {str(exc)}", 500)


# ── Matriz Curricular ─────────────────────────────────────────────────────────

@router.route("GET", "/matriz-curricular")
def listar_matriz_curricular_route(event):
    """Lista a matriz curricular, opcionalmente filtrada por ano letivo e/ou série"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        
        query_params = event.get("queryStringParameters") or {}
        ano_letivo = int(query_params["anoLetivo"]) if query_params.get("anoLetivo") else None
        serie = query_params.get("serie")
        
        resultado = mc_service.listar_matriz_curricular(ano_letivo=ano_letivo, serie=serie)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except ValueError:
        return error("Ano letivo inválido", 400)
    except Exception as exc:
        print(f"[ERROR listar_matriz_curricular_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar matriz curricular: {str(exc)}", 500)


@router.route("GET", "/matriz-curricular/anos-letivos")
def listar_anos_letivos_route(_event):
    """Lista todos os anos letivos que possuem entradas na matriz curricular"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        resultado = mc_service.listar_anos_letivos()
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 500)
    except Exception as exc:
        print(f"[ERROR listar_anos_letivos_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar anos letivos: {str(exc)}", 500)


@router.route("GET", "/matriz-curricular/historico")
def listar_historico_matriz_route(event):
    """Lista o histórico de alterações da matriz curricular"""
    try:
        import app.src.services.matriz_curricular_service as mc_service

        query_params = event.get("queryStringParameters") or {}
        serie      = query_params.get("serie")
        id_matriz  = int(query_params["idMatriz"])  if query_params.get("idMatriz")  else None
        ano_letivo = int(query_params["anoLetivo"]) if query_params.get("anoLetivo") else None
        limit      = int(query_params.get("limit", 50))

        resultado = mc_service.listar_historico(
            serie=serie, ano_letivo=ano_letivo, id_matriz=id_matriz, limit=limit
        )
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    except ValueError:
        return error("Parâmetros inválidos", 400)
    except Exception as exc:
        print(f"[ERROR listar_historico_matriz_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar histórico: {str(exc)}", 500)


@router.route("POST", "/matriz-curricular/copiar")
def copiar_matriz_route(event):
    """Copia a matriz curricular de um ano letivo para outro"""
    try:
        import app.src.services.matriz_curricular_service as mc_service

        body = event.get("body") or "{}"
        resultado = mc_service.copiar_para_ano(body)
        if resultado["success"]:
            payload = resultado.get("data") or {}
            payload["message"] = resultado.get("message", "")
            return ok(payload)
        else:
            return error(resultado["message"], 400)
    except Exception as exc:
        print(f"[ERROR copiar_matriz_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao copiar matriz: {str(exc)}", 500)


@router.route("GET", "/matriz-curricular/{id}")
def buscar_matriz_curricular_route(event):
    """Busca uma entrada específica da matriz curricular por ID"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        
        id_matriz = int(event["pathParameters"]["id"])
        
        resultado = mc_service.buscar_matriz_curricular(id_matriz)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 404)
    
    except ValueError:
        return error("ID da matriz curricular inválido", 400)
    except Exception as exc:
        print(f"[ERROR buscar_matriz_curricular_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao buscar matriz curricular: {str(exc)}", 500)


@router.route("POST", "/matriz-curricular")
def criar_matriz_curricular_route(event):
    """Cria uma nova entrada na matriz curricular"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        
        body = event.get("body", "{}")
        
        resultado = mc_service.criar_matriz_curricular(body)
        
        if resultado["success"]:
            return created(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR criar_matriz_curricular_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao criar entrada na matriz: {str(exc)}", 500)


@router.route("PUT", "/matriz-curricular/serie")
def salvar_serie_route(event):
    """Salva (cria/atualiza) a grade completa de uma série para um ano letivo"""
    try:
        import app.src.services.matriz_curricular_service as mc_service

        body = event.get("body") or "{}"
        resultado = mc_service.salvar_serie(body)
        if resultado["success"]:
            payload = resultado.get("data") or {}
            payload["message"] = resultado.get("message", "")
            return ok(payload)
        else:
            return error(resultado["message"], 400)
    except Exception as exc:
        print(f"[ERROR salvar_serie_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao salvar série: {str(exc)}", 500)


@router.route("PUT", "/matriz-curricular/{id}")
def atualizar_matriz_curricular_route(event):
    """Atualiza uma entrada da matriz curricular"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        
        id_matriz = int(event["pathParameters"]["id"])
        body = event.get("body", "{}")
        
        resultado = mc_service.atualizar_matriz_curricular(id_matriz, body)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 404 if "não encontrada" in resultado["message"] else 400)
    
    except ValueError:
        return error("ID da matriz curricular inválido", 400)
    except Exception as exc:
        print(f"[ERROR atualizar_matriz_curricular_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao atualizar matriz curricular: {str(exc)}", 500)


@router.route("DELETE", "/matriz-curricular/{id}")
def excluir_matriz_curricular_route(event):
    """Exclui uma entrada da matriz curricular"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        
        id_matriz = int(event["pathParameters"]["id"])
        
        resultado = mc_service.excluir_matriz_curricular(id_matriz)
        
        if resultado["success"]:
            return ok({"message": resultado["message"]})
        else:
            return error(resultado["message"], 404)
    
    except ValueError:
        return error("ID da matriz curricular inválido", 400)
    except Exception as exc:
        print(f"[ERROR excluir_matriz_curricular_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao excluir matriz curricular: {str(exc)}", 500)


@router.route("GET", "/matriz-curricular/series/{anoLetivo}")
def listar_series_route(event):
    """Lista todas as séries disponíveis para um ano letivo"""
    try:
        import app.src.services.matriz_curricular_service as mc_service
        
        ano_letivo = int(event["pathParameters"]["anoLetivo"])
        
        resultado = mc_service.listar_series(ano_letivo)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except ValueError:
        return error("Ano letivo inválido", 400)
    except Exception as exc:
        print(f"[ERROR listar_series_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar séries: {str(exc)}", 500)


# ── Áreas de Conhecimento (BNCC) ──────────────────────────────────────────────

@router.route("GET", "/areas-conhecimento")
def listar_areas_conhecimento_route(_event):
    """Lista todas as áreas de conhecimento (BNCC)"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        resultado = disc_service.listar_areas_conhecimento()
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR listar_areas_conhecimento_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar áreas de conhecimento: {str(exc)}", 500)


# ── Tipos de Disciplina ───────────────────────────────────────────────────────

@router.route("GET", "/tipos-disciplina")
def listar_tipos_disciplina_route(_event):
    """Lista todos os tipos de disciplina"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        resultado = disc_service.listar_tipos_disciplina()
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR listar_tipos_disciplina_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar tipos de disciplina: {str(exc)}", 500)


# ── Etapas de Ensino ──────────────────────────────────────────────────────────

@router.route("GET", "/etapas-ensino")
def listar_etapas_ensino_route(_event):
    """Lista todas as etapas de ensino"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        resultado = disc_service.listar_etapas_ensino()
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR listar_etapas_ensino_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar etapas de ensino: {str(exc)}", 500)


# ── Ofertas de Disciplinas (turma_disciplinas) ────────────────────────────────

@router.route("GET", "/ofertas")
def listar_ofertas_route(event):
    """Lista ofertas de disciplinas (opcionalmente por turma)"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        query_params = event.get("queryStringParameters") or {}
        id_turma = query_params.get("idTurma")
        if id_turma:
            id_turma = int(id_turma)
        
        resultado = disc_service.listar_ofertas(id_turma=id_turma)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except ValueError:
        return error("ID da turma inválido", 400)
    except Exception as exc:
        print(f"[ERROR listar_ofertas_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar ofertas: {str(exc)}", 500)


@router.route("POST", "/ofertas")
def criar_oferta_route(event):
    """Cria uma nova oferta de disciplina"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        body = event.get("body", {})
        resultado = disc_service.criar_oferta(body)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR criar_oferta_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao criar oferta: {str(exc)}", 500)


@router.route("PUT", "/ofertas/{id}")
def atualizar_oferta_route(event):
    """Atualiza uma oferta existente"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        id_oferta = int(event["pathParameters"]["id"])
        body = event.get("body", {})
        resultado = disc_service.atualizar_oferta(id_oferta, body)
        
        if resultado["success"]:
            return ok({"message": resultado["message"]})
        else:
            return error(resultado["message"], 400)
    
    except ValueError:
        return error("ID da oferta inválido", 400)
    except Exception as exc:
        print(f"[ERROR atualizar_oferta_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao atualizar oferta: {str(exc)}", 500)


@router.route("DELETE", "/ofertas/{id}")
def deletar_oferta_route(event):
    """Deleta uma oferta"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        id_oferta = int(event["pathParameters"]["id"])
        resultado = disc_service.deletar_oferta(id_oferta)
        
        if resultado["success"]:
            return ok({"message": resultado["message"]})
        else:
            return error(resultado["message"], 404 if "não encontrada" in resultado["message"] else 400)
    
    except ValueError:
        return error("ID da oferta inválido", 400)
    except Exception as exc:
        print(f"[ERROR deletar_oferta_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao deletar oferta: {str(exc)}", 500)


# ── Salas ─────────────────────────────────────────────────────────────────────

@router.route("GET", "/salas")
def listar_salas_route(_event):
    try:
        salas = salas_service.listar_salas()
        print(f"\n[DEBUG listar_salas] Total de salas: {len(salas)}")
        if salas:
            print(f"[DEBUG listar_salas] Primeira: ID={salas[0].get('id')}, codigo={salas[0].get('codigo')}, status='{salas[0].get('status')}'")
            if len(salas) > 1:
                print(f"[DEBUG listar_salas] Última: ID={salas[-1].get('id')}, codigo={salas[-1].get('codigo')}, status='{salas[-1].get('status')}'")
        return ok(salas)
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        print(f"[DEBUG listar_salas] ERRO: {msg}")
        return server_error(msg)


@router.route("POST", "/salas")
def criar_sala_route(event):
    try:
        resultado = salas_service.criar_sala(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("GET", "/salas/{idSala}")
def buscar_sala_route(event):
    try:
        id_sala = int(event["pathParameters"]["idSala"])
        resultado = salas_service.buscar_sala(id_sala)
        if not resultado:
            return not_found(f"Sala {id_sala} não encontrada")
        return ok(resultado)
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("PUT", "/salas/{idSala}")
def atualizar_sala_route(event):
    try:
        id_sala = int(event["pathParameters"]["idSala"])
        resultado = salas_service.atualizar_sala(id_sala, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("DELETE", "/salas/{idSala}")
def excluir_sala_route(event):
    try:
        id_sala = int(event["pathParameters"]["idSala"])
        resultado = salas_service.excluir_sala(id_sala)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))


@router.route("PATCH", "/salas/{idSala}/status")
def alterar_status_sala(event):
    try:
        id_sala = int(event["pathParameters"]["idSala"])
        body = json.loads(event.get("body") or "{}")
        novo_status = body.get("status", "")
        
        print(f"\n[DEBUG alterar_status_sala] ===== INÍCIO =====")
        print(f"[DEBUG alterar_status_sala] ID: {id_sala}")
        print(f"[DEBUG alterar_status_sala] Body recebido: {body}")
        print(f"[DEBUG alterar_status_sala] Novo status: '{novo_status}'")
        
        # Debug: Query direta ao banco ANTES do serviço
        from app.src.adapters.db_adapter import execute_query
        sala_direta = execute_query("SELECT idSala, codSala, status FROM Salas WHERE idSala = %s", (id_sala,))
        if sala_direta:
            print(f"[DEBUG alterar_status_sala] Query direta ANTES: status = {repr(sala_direta[0]['status'])}")
        
        resultado = salas_service.atualizar_status_sala(id_sala, novo_status)
        
        # Debug: Query direta ao banco DEPOIS do serviço
        sala_direta_depois = execute_query("SELECT idSala, codSala, status FROM Salas WHERE idSala = %s", (id_sala,))
        if sala_direta_depois:
            print(f"[DEBUG alterar_status_sala] Query direta DEPOIS: status = {repr(sala_direta_depois[0]['status'])}")
        
        print(f"[DEBUG alterar_status_sala] Resultado: {resultado}")
        print(f"[DEBUG alterar_status_sala] ===== FIM =====\n")
        
        return ok(resultado)
    except ValueError as exc:
        print(f"[DEBUG alterar_status_sala] ValueError: {exc}")
        return error(str(exc))


@router.route("PATCH", "/salas/lote/status")
def alterar_status_lote_salas(event):
    try:
        body = json.loads(event.get("body") or "{}")
        ids = [int(i) for i in body.get("ids", [])]
        status = body.get("status", "")
        total = salas_service.atualizar_status_lote(ids, status)
        return ok({"atualizados": total})
    except ValueError as exc:
        return error(str(exc))


# ── Estrutura Profissional de Turmas ─────────────────────────────────────────

@router.route("GET", "/series")
def listar_series_route(event):
    """Lista todas as séries do sistema"""
    try:
        if not series_service:
            return server_error("Service de séries não disponível")
        
        query_params = event.get("queryStringParameters") or {}
        nivel_ensino = query_params.get("nivel_ensino")
        
        resultado = series_service.listar_series(nivel_ensino=nivel_ensino)
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/series/{idSerie}/disciplinas")
def listar_disciplinas_serie_route(event):
    """Lista disciplinas da matriz curricular de uma série"""
    try:
        if not series_service:
            return server_error("Service de séries não disponível")
        
        id_serie = int(event["pathParameters"]["idSerie"])
        resultado = series_service.listar_disciplinas_serie(id_serie)
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/periodos")
def listar_periodos_route(_event):
    """Lista todos os períodos disponíveis"""
    try:
        if not periodos_service:
            return server_error("Service de períodos não disponível")
        
        resultado = periodos_service.listar_periodos()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/anos-letivos")
def listar_anos_letivos_route(event):
    """Lista anos letivos"""
    try:
        if not anos_letivos_service:
            return server_error("Service de anos letivos não disponível")
        
        query_params = event.get("queryStringParameters") or {}
        status = query_params.get("status")
        
        resultado = anos_letivos_service.listar_anos_letivos(status=status)
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/anos-letivos/atual")
def buscar_ano_letivo_atual_route(_event):
    """Busca o ano letivo atual"""
    try:
        if not anos_letivos_service:
            return server_error("Service de anos letivos não disponível")
        
        resultado = anos_letivos_service.buscar_ano_letivo_atual()
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


# ── Turmas (Nova Estrutura) ──────────────────────────────────────────────────

# ── Turmas (Nova Estrutura) ──────────────────────────────────────────────────
# IMPORTANTE: Rotas estáticas ANTES de rotas com parâmetros

@router.route("GET", "/turmas/validar-sala")
def validar_ocupacao_sala_route(event):
    """Valida se sala está disponível"""
    try:
        if not turma_service:
            return server_error("Service de turmas não disponível")
        
        query_params = event.get("queryStringParameters") or {}
        sala_id = query_params.get("sala_id")
        periodo_id = query_params.get("periodo_id")
        ano_letivo_id = query_params.get("ano_letivo_id")
        turma_id = query_params.get("turma_id")  # Para edição
        
        if not all([sala_id, periodo_id, ano_letivo_id]):
            return error("Parâmetros obrigatórios: sala_id, periodo_id, ano_letivo_id")
        
        resultado = turma_service.validar_ocupacao_sala(
            int(sala_id),
            int(periodo_id),
            int(ano_letivo_id),
            int(turma_id) if turma_id else None
        )
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/turmas/relatorio-ocupacao")
def relatorio_ocupacao_salas_route(event):
    """Gera relatório de ocupação de salas"""
    try:
        if not turma_service:
            return server_error("Service de turmas não disponível")
        
        query_params = event.get("queryStringParameters") or {}
        ano_letivo_id = query_params.get("ano_letivo_id")
        
        if not ano_letivo_id:
            # Buscar ano letivo atual
            if anos_letivos_service:
                resultado_ano = anos_letivos_service.buscar_ano_letivo_atual()
                if resultado_ano.get("sucesso"):
                    ano_letivo_id = resultado_ano["ano_letivo"]["idAnoLetivo"]
                else:
                    return error("Ano letivo não especificado e não foi possível determinar o ano atual")
            else:
                return error("ano_letivo_id é obrigatório")
        
        resultado = turma_service.relatorio_ocupacao_salas(int(ano_letivo_id))
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("PATCH", "/turmas/lote/status")
def alterar_status_lote_turmas(event):
    try:
        body = json.loads(event.get("body") or "{}")
        ids = [int(i) for i in body.get("ids", [])]
        status = body.get("status", "")
        total = turmas_service.alterar_status_lote(ids, status)
        return ok({"atualizados": total})
    except ValueError as exc:
        return error(str(exc))


@router.route("GET", "/turmas")
def listar_turmas_route(event):
    """Lista turmas com filtros opcionais"""
    try:
        # Tentar usar novo service primeiro
        if turma_service:
            query_params = event.get("queryStringParameters") or {}
            
            resultado = turma_service.listar_turmas(
                ano_letivo_id=query_params.get("ano_letivo_id"),
                serie_id=query_params.get("serie_id"),
                periodo_id=query_params.get("periodo_id"),
                status=query_params.get("status"),
                sala_id=query_params.get("sala_id")
            )
            return ok(resultado)
        else:
            # Fallback para service antigo
            return ok(turmas_service.listar_turmas())
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("POST", "/turmas")
def criar_turma_route(event):
    """Cria uma nova turma"""
    try:
        body = json.loads(event.get("body") or "{}")
        
        # Usar novo service se disponível
        if turma_service:
            resultado = turma_service.criar_turma(body)
            if resultado.get("sucesso"):
                return created(resultado)
            else:
                return error(resultado.get("erro", "Erro ao criar turma"))
        else:
            # Fallback para service antigo
            resultado = turmas_service.criar_turma(event.get("body") or "{}")
            return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("GET", "/turmas/{idTurma}/historico")
def buscar_historico_turma_route(event):
    """Busca histórico de eventos da turma"""
    try:
        if not turma_service:
            return server_error("Service de turmas não disponível")
        
        id_turma = int(event["pathParameters"]["idTurma"])
        resultado = turma_service.buscar_historico_turma(id_turma)
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/turmas/{idTurma}/educandos")
def listar_educandos_turma(event):
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
        return ok(turmas_service.listar_educandos_turma(id_turma))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("PATCH", "/turmas/{idTurma}/status")
def alterar_status_turma(event):
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
        body = json.loads(event.get("body") or "{}")
        status = body.get("status", "")
        resultado = turmas_service.alterar_status(id_turma, status)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))


@router.route("GET", "/turmas/{idTurma}")
def buscar_turma_route(event):
    """Busca detalhes de uma turma"""
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
        
        # Usar novo service se disponível
        if turma_service:
            resultado = turma_service.buscar_turma_por_id(id_turma)
            if resultado.get("sucesso"):
                return ok(resultado)
            else:
                return not_found(f"Turma {id_turma} não encontrada")
        else:
            # Fallback para service antigo
            resultado = turmas_service.buscar_turma(id_turma)
            if not resultado:
                return not_found(f"Turma {id_turma} não encontrada")
            return ok(resultado)
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("PUT", "/turmas/{idTurma}")
def atualizar_turma_route(event):
    """Atualiza uma turma existente"""
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
        body = json.loads(event.get("body") or "{}")
        
        # Usar novo service se disponível
        if turma_service:
            resultado = turma_service.atualizar_turma(id_turma, body)
            if resultado.get("sucesso"):
                return ok(resultado)
            else:
                return error(resultado.get("erro", "Erro ao atualizar turma"))
        else:
            # Fallback para service antigo
            resultado = turmas_service.atualizar_turma(id_turma, event.get("body") or "{}")
            return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("DELETE", "/turmas/{idTurma}")
def excluir_turma_route(event):
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
        turmas_service.deletar_turma(id_turma)
        return ok({"deleted": id_turma})
    except ValueError as exc:
        return error(str(exc))



def listar_alunos(event):
    qs = event.get("queryStringParameters") or {}
    turma_id = qs.get("turma_id")
    return ok(alunos_service.listar_alunos(int(turma_id) if turma_id else None))


@router.route("GET", "/alunos/{id}")
def buscar_aluno(event):
    aluno_id = int(event["pathParameters"]["id"])
    aluno = alunos_service.buscar_aluno(aluno_id)
    if not aluno:
        return not_found("Aluno não encontrado")
    return ok(aluno)


@router.route("POST", "/alunos")
def criar_aluno(event):
    try:
        resultado = alunos_service.criar_aluno(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))


@router.route("PUT", "/alunos/{id}")
def atualizar_aluno(event):
    try:
        aluno_id = int(event["pathParameters"]["id"])
        resultado = alunos_service.atualizar_aluno(aluno_id, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))


@router.route("DELETE", "/alunos/{id}")
def remover_aluno(event):
    aluno_id = int(event["pathParameters"]["id"])
    return ok(alunos_service.remover_aluno(aluno_id))


@router.route("GET", "/alunos/{id}/notas")
def notas_aluno(event):
    aluno_id = int(event["pathParameters"]["id"])
    return ok(alunos_service.notas_do_aluno(aluno_id))


@router.route("GET", "/alunos/{id}/frequencia")
def frequencia_aluno(event):
    aluno_id = int(event["pathParameters"]["id"])
    return ok(alunos_service.frequencia_do_aluno(aluno_id))


# ── Disciplinas (Cronograma) ──────────────────────────────────────────────────

@router.route("GET", "/cronograma/disciplinas")
def listar_disciplinas_cronograma(event):
    """Lista disciplinas ativas para seleção no cronograma"""
    try:
        import app.src.services.disciplinas_service as disc_service
        
        query_params = event.get("queryStringParameters") or {}
        status = query_params.get("status", "ativa")
        resultado = disc_service.listar_disciplinas(status=status)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR listar_disciplinas_cronograma] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ── Educadores (Cronograma) ───────────────────────────────────────────────────

@router.route("GET", "/cronograma/educadores")
def listar_educadores_cronograma(event):
    """Lista educadores ativos, opcionalmente filtrados por disciplina"""
    try:
        query_params = event.get("queryStringParameters") or {}
        disciplina_id = query_params.get("disciplinaId")
        status = query_params.get("status", "ativo")
        
        if disciplina_id:
            resultado = educadores_service.listar_educadores_por_disciplina(
                int(disciplina_id),
                status=status
            )
        else:
            resultado = educadores_service.listar_educadores(status=status)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR listar_educadores_cronograma] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ── Cronograma ────────────────────────────────────────────────────────────────

@router.route("GET", "/cronograma")
def listar_cronograma(event):
    """Lista horários de uma turma específica"""
    try:
        query_params = event.get("queryStringParameters") or {}
        turma_id = query_params.get("turmaId")
        
        if not turma_id:
            return error("turmaId é obrigatório")
        
        resultado = cronograma_service.listar_cronograma_turma(int(turma_id))
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR listar_cronograma] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("POST", "/cronograma")
def criar_horario_cronograma(event):
    """Cria um novo horário no cronograma"""
    try:
        body = json.loads(event.get("body") or "{}")
        resultado = cronograma_service.criar_aula(body)
        
        if resultado["success"]:
            return created(resultado["data"])
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR criar_horario_cronograma] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("PUT", "/cronograma/{idCronograma}")
def atualizar_horario_cronograma(event):
    """Atualiza um horário existente no cronograma"""
    try:
        id_cronograma = int(event["pathParameters"]["idCronograma"])
        body = json.loads(event.get("body") or "{}")
        resultado = cronograma_service.atualizar_aula(id_cronograma, body)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR atualizar_horario_cronograma] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("DELETE", "/cronograma/{idCronograma}")
def deletar_horario_cronograma(event):
    """Remove um horário do cronograma"""
    try:
        id_cronograma = int(event["pathParameters"]["idCronograma"])
        resultado = cronograma_service.deletar_aula(id_cronograma)
        
        if resultado["success"]:
            return ok({"message": resultado["message"]})
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR deletar_horario_cronograma] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ── Cronograma Avançado ───────────────────────────────────────────────────────

@router.route("POST", "/cronograma/gerar-automatico")
def gerar_grade_automatica(event):
    """Gera grade horária completa automaticamente para uma turma"""
    try:
        from app.src.services import cronograma_advanced_service
        
        body = json.loads(event.get("body") or "{}")
        id_turma = body.get("idTurma")
        id_periodo = body.get("idPeriodo")
        
        if not id_turma or not id_periodo:
            return error("idTurma e idPeriodo são obrigatórios")
        
        resultado = cronograma_advanced_service.gerar_grade_automatica(id_turma, id_periodo)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado.get("message", "Erro ao gerar grade"))
    except Exception as exc:
        print(f"[ERROR gerar_grade_automatica] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("POST", "/cronograma/otimizar")
def otimizar_grade(event):
    """Analisa e otimiza uma grade existente"""
    try:
        from app.src.services import cronograma_advanced_service
        
        body = json.loads(event.get("body") or "{}")
        id_turma = body.get("idTurma")
        
        if not id_turma:
            return error("idTurma é obrigatório")
        
        resultado = cronograma_advanced_service.otimizar_grade(id_turma)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR otimizar_grade] {exc}")
        return server_error(str(exc))


@router.route("GET", "/cronograma/conflitos")
def listar_conflitos(event):
    """Lista todos os conflitos detectados no sistema"""
    try:
        from app.src.services import cronograma_advanced_service
        
        resultado = cronograma_advanced_service.detectar_todos_conflitos()
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_conflitos] {exc}")
        return server_error(str(exc))


@router.route("POST", "/cronograma/sugerir-horarios")
def sugerir_horarios_livres(event):
    """Sugere horários livres para agendamento"""
    try:
        from app.src.services import cronograma_advanced_service
        
        body = json.loads(event.get("body") or "{}")
        resultado = cronograma_advanced_service.sugerir_horarios_livres(
            id_educador=body.get("idEducador"),
            id_sala=body.get("idSala"),
            id_turma=body.get("idTurma")
        )
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR sugerir_horarios] {exc}")
        return server_error(str(exc))


@router.route("GET", "/cronograma/educador/{idEducador}")
def listar_cronograma_educador(event):
    """Lista todos os horários de um educador"""
    try:
        from app.src.services import cronograma_advanced_service
        
        id_educador = int(event["pathParameters"]["idEducador"])
        resultado = cronograma_advanced_service.listar_por_educador(id_educador)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_cronograma_educador] {exc}")
        return server_error(str(exc))


@router.route("GET", "/cronograma/sala/{idSala}")
def listar_cronograma_sala(event):
    """Lista todos os horários de uma sala"""
    try:
        from app.src.services import cronograma_advanced_service
        
        id_sala = int(event["pathParameters"]["idSala"])
        resultado = cronograma_advanced_service.listar_por_sala(id_sala)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_cronograma_sala] {exc}")
        return server_error(str(exc))


@router.route("GET", "/cronograma/{idCronograma}/auditoria")
def historico_auditoria_cronograma(event):
    """Retorna histórico de alterações de uma aula"""
    try:
        from app.src.services import cronograma_advanced_service
        
        id_cronograma = int(event["pathParameters"]["idCronograma"])
        resultado = cronograma_advanced_service.historico_auditoria(id_cronograma)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR historico_auditoria] {exc}")
        return server_error(str(exc))


# ── Eventos Escolares ─────────────────────────────────────────────────────────

@router.route("GET", "/eventos")
def listar_eventos(event):
    """Lista eventos escolares com filtros opcionais"""
    try:
        from app.src.services import eventos_service
        
        params = event.get("queryStringParameters") or {}
        tipo_evento = params.get("tipo")
        status = params.get("status")
        data_inicio = params.get("dataInicio")
        data_fim = params.get("dataFim")
        
        resultado = eventos_service.listar_eventos(tipo_evento, status, data_inicio, data_fim)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_eventos] {exc}")
        return server_error(str(exc))


@router.route("GET", "/eventos/turma/{idTurma}")
def listar_eventos_turma(event):
    """Lista eventos de uma turma específica"""
    try:
        from app.src.services import eventos_service
        
        id_turma = int(event["pathParameters"]["idTurma"])
        resultado = eventos_service.listar_eventos_turma(id_turma)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_eventos_turma] {exc}")
        return server_error(str(exc))


@router.route("GET", "/eventos/calendario/{ano}/{mes}")
def calendario_mensal(event):
    """Retorna calendário mensal com eventos e aulas"""
    try:
        from app.src.services import eventos_service
        
        ano = int(event["pathParameters"]["ano"])
        mes = int(event["pathParameters"]["mes"])
        params = event.get("queryStringParameters") or {}
        id_turma = params.get("idTurma")
        
        resultado = eventos_service.calendario_mensal(
            ano, mes, int(id_turma) if id_turma else None
        )
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR calendario_mensal] {exc}")
        return server_error(str(exc))


@router.route("POST", "/eventos")
def criar_evento(event):
    """Cria um novo evento escolar"""
    try:
        from app.src.services import eventos_service
        
        body = json.loads(event.get("body") or "{}")
        resultado = eventos_service.criar_evento(body)
        
        if resultado["success"]:
            return created(resultado)
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR criar_evento] {exc}")
        return server_error(str(exc))


@router.route("PUT", "/eventos/{idEvento}")
def atualizar_evento(event):
    """Atualiza um evento existente"""
    try:
        from app.src.services import eventos_service
        
        id_evento = int(event["pathParameters"]["idEvento"])
        body = json.loads(event.get("body") or "{}")
        
        resultado = eventos_service.atualizar_evento(id_evento, body)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR atualizar_evento] {exc}")
        return server_error(str(exc))


@router.route("DELETE", "/eventos/{idEvento}")
def deletar_evento(event):
    """Remove um evento"""
    try:
        from app.src.services import eventos_service
        
        id_evento = int(event["pathParameters"]["idEvento"])
        resultado = eventos_service.deletar_evento(id_evento)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR deletar_evento] {exc}")
        return server_error(str(exc))


# ── Reposições de Aulas ───────────────────────────────────────────────────────

@router.route("GET", "/reposicoes")
def listar_reposicoes(event):
    """Lista reposições com filtro opcional de status"""
    import sys
    sys.stdout.write("[DEBUG listar_reposicoes endpoint] INÍCIO\n")
    sys.stdout.flush()
    print("[DEBUG listar_reposicoes endpoint] INÍCIO")
    try:
        print("[DEBUG listar_reposicoes endpoint] Importando service...")
        sys.stdout.flush()
        from app.src.services import reposicao_service
        print(f"[DEBUG listar_reposicoes endpoint] Service importado: {reposicao_service}")
        sys.stdout.flush()
        
        params = event.get("queryStringParameters") or {}
        status = params.get("status")
        print(f"[DEBUG listar_reposicoes endpoint] Status: {status}")
        sys.stdout.flush()
        
        print("[DEBUG listar_reposicoes endpoint] Chamando service...")
        sys.stdout.flush()
        resultado = reposicao_service.listar_reposicoes(status)
        print(f"[DEBUG listar_reposicoes endpoint] Resultado: {resultado}")
        sys.stdout.flush()
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_reposicoes] {exc}")
        sys.stdout.flush()
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/reposicoes/pendentes")
def listar_reposicoes_pendentes(event):
    """Lista apenas reposições pendentes"""
    try:
        from app.src.services import reposicao_service
        
        resultado = reposicao_service.listar_reposicoes_pendentes()
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR listar_reposicoes_pendentes] {exc}")
        return server_error(str(exc))


@router.route("POST", "/reposicoes/cancelamento")
def registrar_cancelamento_aula(event):
    """Registra o cancelamento de uma aula"""
    try:
        from app.src.services import reposicao_service
        
        body = json.loads(event.get("body") or "{}")
        resultado = reposicao_service.registrar_cancelamento(body)
        
        if resultado["success"]:
            return created(resultado)
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR registrar_cancelamento] {exc}")
        return server_error(str(exc))


@router.route("POST", "/reposicoes/{idReposicao}/agendar")
def agendar_reposicao(event):
    """Agenda a data e horário de uma reposição"""
    try:
        from app.src.services import reposicao_service
        
        id_reposicao = int(event["pathParameters"]["idReposicao"])
        body = json.loads(event.get("body") or "{}")
        
        resultado = reposicao_service.agendar_reposicao(id_reposicao, body)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR agendar_reposicao] {exc}")
        return server_error(str(exc))


@router.route("PATCH", "/reposicoes/{idReposicao}/realizada")
def marcar_reposicao_realizada(event):
    """Marca uma reposição como realizada"""
    try:
        from app.src.services import reposicao_service
        
        id_reposicao = int(event["pathParameters"]["idReposicao"])
        resultado = reposicao_service.marcar_reposicao_realizada(id_reposicao)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
    except Exception as exc:
        print(f"[ERROR marcar_reposicao_realizada] {exc}")
        return server_error(str(exc))


@router.route("GET", "/reposicoes/{idReposicao}/sugestoes")
def sugerir_horarios_reposicao(event):
    """Sugere horários disponíveis para uma reposição"""
    try:
        from app.src.services import reposicao_service
        
        id_reposicao = int(event["pathParameters"]["idReposicao"])
        resultado = reposicao_service.sugerir_horarios_reposicao(id_reposicao)
        return ok(resultado)
    except Exception as exc:
        print(f"[ERROR sugerir_horarios_reposicao] {exc}")
        return server_error(str(exc))


# ═══════════════════════════════════════════════════════════════════════════
# MINHAS TURMAS - Frequência, Atividades e Notas
# ═══════════════════════════════════════════════════════════════════════════

# ── Turmas do Educador ────────────────────────────────────────────────────────

@router.route("GET", "/educador/{matricula}/turmas")
def listar_turmas_educador(event):
    """Lista turmas que o educador leciona"""
    try:
        from app.src.services import educador_service
        from app.src.models.models import EducadorDisciplinaModel
        
        matricula = event["pathParameters"]["matricula"]
        
        # Buscar ID do educador
        educador = educador_service.buscar_educador(matricula)
        if not educador:
            return not_found("Educador não encontrado")
        
        id_educador = educador['idEducador']
        
        # Buscar disciplinas do educador
        disciplinas = EducadorDisciplinaModel.find_by_educador(id_educador)
        
        # Agrupar por turma
        turmas_map = {}
        for disc in disciplinas:
            id_turma = disc['idTurma']
            if id_turma not in turmas_map:
                turma_info = turmas_service.buscar_turma(id_turma)
                if turma_info:
                    turmas_map[id_turma] = {
                        **turma_info,
                        'disciplinas': []
                    }
            
            if id_turma in turmas_map:
                turmas_map[id_turma]['disciplinas'].append({
                    'idDisciplina': disc['idDisciplina'],
                    'nomeDisciplina': disc.get('nomeDisciplina', ''),
                    'codDisciplina': disc.get('codDisciplina', '')
                })
        
        turmas = list(turmas_map.values())
        return ok(turmas)
        
    except Exception as exc:
        print(f"[ERROR listar_turmas_educador] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/turma/{idTurma}/educandos")
def listar_educandos_turma(event):
    """Lista educandos matriculados em uma turma"""
    try:
        from app.src.services import frequencia_service
        
        id_turma = int(event["pathParameters"]["idTurma"])
        educandos = frequencia_service.obter_educandos_turma(id_turma)
        
        return ok(educandos)
        
    except Exception as exc:
        print(f"[ERROR listar_educandos_turma] {exc}")
        return server_error(str(exc))


# ── Frequência ────────────────────────────────────────────────────────────────

@router.route("POST", "/frequencia")
def registrar_frequencia(event):
    """Registra frequência de uma aula"""
    try:
        from app.src.services import frequencia_service
        
        body = json.loads(event.get("body") or "{}")
        
        id_turma = body.get("idTurma")
        id_disciplina = body.get("idDisciplina")
        id_educador = body.get("idEducador")
        data_aula = body.get("data")
        registros = body.get("registros", [])
        
        if not all([id_turma, id_disciplina, id_educador, data_aula]):
            return error("idTurma, idDisciplina, idEducador e data são obrigatórios")
        
        resultado = frequencia_service.registrar_frequencia_aula(
            id_turma, id_disciplina, id_educador, data_aula, registros
        )
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR registrar_frequencia] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/frequencia")
def buscar_frequencia(event):
    """Busca frequência de uma aula específica"""
    try:
        from app.src.services import frequencia_service
        
        params = event.get("queryStringParameters") or {}
        id_turma = int(params.get("idTurma"))
        id_disciplina = int(params.get("idDisciplina"))
        data = params.get("data")
        
        if not all([id_turma, id_disciplina, data]):
            return error("idTurma, idDisciplina e data são obrigatórios")
        
        resultado = frequencia_service.buscar_frequencia_aula(
            id_turma, id_disciplina, data
        )
        
        return ok(resultado)
        
    except Exception as exc:
        print(f"[ERROR buscar_frequencia] {exc}")
        return server_error(str(exc))


@router.route("GET", "/frequencia/datas")
def listar_datas_frequencia(event):
    """Lista datas com frequência registrada"""
    try:
        from app.src.services import frequencia_service
        
        params = event.get("queryStringParameters") or {}
        id_turma = int(params.get("idTurma"))
        id_disciplina = int(params.get("idDisciplina"))
        
        datas = frequencia_service.buscar_datas_registradas(id_turma, id_disciplina)
        return ok({"datas": datas})
        
    except Exception as exc:
        print(f"[ERROR listar_datas_frequencia] {exc}")
        return server_error(str(exc))


@router.route("GET", "/frequencia/relatorio/turma/{idTurma}")
def relatorio_frequencia_turma(event):
    """Gera relatório de frequência da turma"""
    try:
        from app.src.services import frequencia_service
        
        id_turma = int(event["pathParameters"]["idTurma"])
        params = event.get("queryStringParameters") or {}
        id_disciplina = int(params.get("idDisciplina"))
        
        relatorio = frequencia_service.gerar_relatorio_frequencia_turma(
            id_turma, id_disciplina
        )
        
        return ok(relatorio)
        
    except Exception as exc:
        print(f"[ERROR relatorio_frequencia_turma] {exc}")
        return server_error(str(exc))


@router.route("GET", "/frequencia/relatorio/educando/{idMatricula}")
def relatorio_frequencia_educando(event):
    """Gera relatório de frequência de um educando"""
    try:
        from app.src.services import frequencia_service
        
        id_matricula = int(event["pathParameters"]["idMatricula"])
        params = event.get("queryStringParameters") or {}
        id_turma = int(params.get("idTurma"))
        id_disciplina = int(params.get("idDisciplina"))
        
        relatorio = frequencia_service.gerar_relatorio_frequencia_educando(
            id_matricula, id_turma, id_disciplina
        )
        
        return ok(relatorio)
        
    except Exception as exc:
        print(f"[ERROR relatorio_frequencia_educando] {exc}")
        return server_error(str(exc))


# ── Atividades ────────────────────────────────────────────────────────────────

@router.route("GET", "/atividades")
def listar_atividades(event):
    """Lista atividades de uma turma/disciplina"""
    try:
        from app.src.services import atividade_service
        
        params = event.get("queryStringParameters") or {}
        id_turma = int(params.get("idTurma"))
        id_disciplina = int(params.get("idDisciplina"))
        
        atividades = atividade_service.listar_atividades_turma_disciplina(
            id_turma, id_disciplina
        )
        
        return ok(atividades)
        
    except Exception as exc:
        print(f"[ERROR listar_atividades] {exc}")
        return server_error(str(exc))


@router.route("GET", "/atividades/{idAtividade}")
def buscar_atividade(event):
    """Busca uma atividade específica"""
    try:
        from app.src.services import atividade_service
        
        id_atividade = int(event["pathParameters"]["idAtividade"])
        atividade = atividade_service.buscar_atividade(id_atividade)
        
        if not atividade:
            return not_found("Atividade não encontrada")
        
        return ok(atividade)
        
    except Exception as exc:
        print(f"[ERROR buscar_atividade] {exc}")
        return server_error(str(exc))


@router.route("POST", "/atividades")
def criar_atividade(event):
    """Cria uma nova atividade avaliativa"""
    try:
        from app.src.services import atividade_service
        
        body = json.loads(event.get("body") or "{}")
        resultado = atividade_service.criar_atividade(body)
        
        if resultado["success"]:
            return created(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR criar_atividade] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("PUT", "/atividades/{idAtividade}")
def atualizar_atividade(event):
    """Atualiza uma atividade"""
    try:
        from app.src.services import atividade_service
        
        id_atividade = int(event["pathParameters"]["idAtividade"])
        body = json.loads(event.get("body") or "{}")
        
        resultado = atividade_service.atualizar_atividade(id_atividade, body)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR atualizar_atividade] {exc}")
        return server_error(str(exc))


@router.route("DELETE", "/atividades/{idAtividade}")
def excluir_atividade(event):
    """Exclui (cancela) uma atividade"""
    try:
        from app.src.services import atividade_service
        
        id_atividade = int(event["pathParameters"]["idAtividade"])
        resultado = atividade_service.excluir_atividade(id_atividade)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR excluir_atividade] {exc}")
        return server_error(str(exc))


# ── Notas ─────────────────────────────────────────────────────────────────────

@router.route("POST", "/notas")
def lancar_notas(event):
    """Lança notas de múltiplos educandos em uma atividade"""
    try:
        from app.src.services import nota_service
        
        body = json.loads(event.get("body") or "{}")
        
        id_atividade = body.get("idAtividade")
        id_educador = body.get("idEducador")
        notas = body.get("notas", [])
        
        if not all([id_atividade, id_educador]):
            return error("idAtividade e idEducador são obrigatórios")
        
        resultado = nota_service.lancar_notas_atividade(
            id_atividade, id_educador, notas
        )
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR lancar_notas] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/notas/atividade/{idAtividade}")
def buscar_notas_atividade(event):
    """Busca notas de todos educandos em uma atividade"""
    try:
        from app.src.services import nota_service
        
        id_atividade = int(event["pathParameters"]["idAtividade"])
        resultado = nota_service.buscar_notas_atividade(id_atividade)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR buscar_notas_atividade] {exc}")
        return server_error(str(exc))


@router.route("GET", "/notas/educando/{idMatricula}")
def buscar_notas_educando(event):
    """Busca notas de um educando em uma disciplina"""
    try:
        from app.src.services import nota_service
        
        id_matricula = int(event["pathParameters"]["idMatricula"])
        params = event.get("queryStringParameters") or {}
        id_turma = int(params.get("idTurma"))
        id_disciplina = int(params.get("idDisciplina"))
        
        resultado = nota_service.buscar_notas_educando(
            id_matricula, id_turma, id_disciplina
        )
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR buscar_notas_educando] {exc}")
        return server_error(str(exc))


@router.route("GET", "/notas/relatorio/turma/{idTurma}")
def relatorio_notas_turma(event):
    """Gera relatório de médias da turma"""
    try:
        from app.src.services import nota_service
        
        id_turma = int(event["pathParameters"]["idTurma"])
        params = event.get("queryStringParameters") or {}
        id_disciplina = int(params.get("idDisciplina"))
        
        resultado = nota_service.calcular_media_turma(id_turma, id_disciplina)
        
        if resultado["success"]:
            return ok(resultado)
        else:
            return error(resultado["message"])
            
    except Exception as exc:
        print(f"[ERROR relatorio_notas_turma] {exc}")
        return server_error(str(exc))


# ═══════════════════════════════════════════════════════════════════════════
# CRONOGRAMA POR PERFIL - Visões específicas para cada tipo de usuário
# ═══════════════════════════════════════════════════════════════════════════

@router.route("GET", "/cronograma/gestor")
def cronograma_gestor(event):
    """Visão completa do gestor - todos os horários com filtros"""
    try:
        from app.src.models.models import CronogramaModel
        
        params = event.get("queryStringParameters") or {}
        filtros = {}
        
        # Aplicar filtros opcionais
        if params.get("idTurma"):
            horarios = CronogramaModel.find_by_turma(int(params["idTurma"]))
        elif params.get("idEducador"):
            horarios = CronogramaModel.find_by_educador(params["idEducador"])
        elif params.get("idSala"):
            horarios = CronogramaModel.find_by_sala(int(params["idSala"]))
        else:
            horarios = CronogramaModel.find_all()
        
        return ok({
            "horarios": horarios,
            "total": len(horarios)
        })
    except Exception as exc:
        print(f"[ERROR cronograma_gestor] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/cronograma/educando/{idMatricula}")
def cronograma_educando(event):
    """Visão do educando - grade da sua turma"""
    try:
        from app.src.models.models import CronogramaModel, HistoricoEscolarModel
        
        id_matricula = event["pathParameters"]["idMatricula"]
        
        # Buscar turma do educando (via histórico escolar)
        historico = HistoricoEscolarModel.find_by_id_matricula(id_matricula)
        
        if not historico or len(historico) == 0:
            return ok({
                "horarios": [],
                "message": "Educando não possui turma ativa"
            })
        
        # Pegar a turma mais recente
        turma_atual = historico[0]
        id_turma = turma_atual.get("idTurma")
        
        if not id_turma:
            return ok({
                "horarios": [],
                "message": "Turma não encontrada"
            })
        
        # Buscar cronograma da turma
        horarios = CronogramaModel.find_by_turma(id_turma)
        
        return ok({
            "horarios": horarios,
            "turma": {
                "idTurma": id_turma,
                "codTurma": turma_atual.get("codTurma"),
                "nomeTurma": turma_atual.get("nomeTurma")
            }
        })
    except Exception as exc:
        print(f"[ERROR cronograma_educando] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/cronograma/responsavel/{idResponsavel}")
def cronograma_responsavel(event):
    """Visão do responsável - grade dos filhos"""
    try:
        from app.src.models.models import (
            CronogramaModel, 
            EducandoResponsavelModel, 
            HistoricoEscolarModel
        )
        
        id_responsavel = event["pathParameters"]["idResponsavel"]
        
        # Buscar filhos do responsável
        filhos = EducandoResponsavelModel.find_by_responsavel(id_responsavel)
        
        if not filhos or len(filhos) == 0:
            return ok({
                "filhos": [],
                "message": "Nenhum filho encontrado"
            })
        
        resultado = []
        
        for filho in filhos:
            id_matricula = filho.get("idMatricula")
            
            # Buscar turma do filho
            historico = HistoricoEscolarModel.find_by_id_matricula(id_matricula)
            
            if historico and len(historico) > 0:
                turma_atual = historico[0]
                id_turma = turma_atual.get("idTurma")
                
                if id_turma:
                    # Buscar cronograma da turma
                    horarios = CronogramaModel.find_by_turma(id_turma)
                    
                    resultado.append({
                        "filho": {
                            "idMatricula": id_matricula,
                            "nomeCompleto": filho.get("nomeCompleto")
                        },
                        "turma": {
                            "idTurma": id_turma,
                            "codTurma": turma_atual.get("codTurma"),
                            "nomeTurma": turma_atual.get("nomeTurma")
                        },
                        "horarios": horarios
                    })
        
        return ok({
            "filhos": resultado,
            "total": len(resultado)
        })
    except Exception as exc:
        print(f"[ERROR cronograma_responsavel] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("POST", "/cronograma/validar")
def validar_horario(event):
    """Valida um horário SEM SALVAR (preview de conflitos)"""
    try:
        from app.src.services.cronograma_advanced_service import ValidadorCronograma
        
        body = json.loads(event.get("body") or "{}")
        id_excluir = body.get("idCronograma")  # Para updates
        
        valido, erros = ValidadorCronograma.validar_horario_completo(body, id_excluir)
        
        return ok({
            "valido": valido,
            "erros": erros,
            "dados": body
        })
    except Exception as exc:
        print(f"[ERROR validar_horario] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ═══════════════════════════════════════════════════════════════════════════
# ATIVIDADES PEDAGÓGICAS - CRUD Completo
# ═══════════════════════════════════════════════════════════════════════════

@router.route("GET", "/atividades")
def listar_atividades(event):
    """Lista atividades com filtros"""
    try:
        from app.src.models.models import AtividadeModel
        
        params = event.get("queryStringParameters") or {}
        
        if params.get("idTurma"):
            atividades = AtividadeModel.find_by_turma(int(params["idTurma"]))
        elif params.get("idEducador"):
            atividades = AtividadeModel.find_by_educador(params["idEducador"])
        else:
            status = params.get("status")
            atividades = AtividadeModel.find_all(status)
        
        return ok({
            "atividades": atividades,
            "total": len(atividades)
        })
    except Exception as exc:
        print(f"[ERROR listar_atividades] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("POST", "/atividades")
def criar_atividade(event):
    """Cria uma nova atividade pedagógica"""
    try:
        from app.src.models.models import AtividadeModel
        
        body = json.loads(event.get("body") or "{}")
        
        # Validações básicas
        if not body.get("titulo"):
            return error("Título é obrigatório")
        if not body.get("idTurma"):
            return error("Turma é obrigatória")
        if not body.get("idDisciplina"):
            return error("Disciplina é obrigatória")
        if not body.get("idEducador"):
            return error("Educador é obrigatório")
        
        id_atividade = AtividadeModel.create(body)
        
        return created({
            "idAtividade": id_atividade,
            "message": "Atividade criada com sucesso"
        })
    except Exception as exc:
        print(f"[ERROR criar_atividade] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ── Fornecedores ─────────────────────────────────────────────────────────────

@router.route("GET", "/fornecedores")
def listar_fornecedores(_event):
    try:
        return ok(fornecedor_service.listar_fornecedores())
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/fornecedores")
def criar_fornecedor(event):
    try:
        resultado = fornecedor_service.criar_fornecedor(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/fornecedores/{idFornecedor}")
def buscar_fornecedor(event):
    try:
        id_fornecedor = int(event["pathParameters"]["idFornecedor"])
        resultado = fornecedor_service.buscar_fornecedor(id_fornecedor)
        if not resultado:
            return not_found("Fornecedor não encontrado")
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("PUT", "/fornecedores/{idFornecedor}")
def atualizar_fornecedor(event):
    try:
        id_fornecedor = int(event["pathParameters"]["idFornecedor"])
        resultado = fornecedor_service.atualizar_fornecedor(id_fornecedor, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("PATCH", "/fornecedores/{idFornecedor}/status")
def atualizar_status_fornecedor(event):
    try:
        id_fornecedor = int(event["pathParameters"]["idFornecedor"])
        body = json.loads(event.get("body") or "{}")
        ativo = body.get("ativo")
        if ativo is None:
            return error("campo 'ativo' é obrigatório")
        resultado = fornecedor_service.atualizar_status_fornecedor(id_fornecedor, bool(ativo))
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("DELETE", "/fornecedores/{idFornecedor}")
def excluir_fornecedor(event):
    try:
        id_fornecedor = int(event["pathParameters"]["idFornecedor"])
        return ok(fornecedor_service.excluir_fornecedor(id_fornecedor))
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/fornecedores/lote/status")
def atualizar_status_lote_fornecedores(event):
    try:
        body = json.loads(event.get("body") or "{}")
        ids = [int(i) for i in body.get("ids", [])]
        ativo = bool(body.get("ativo"))
        return ok(fornecedor_service.atualizar_status_lote(ids, ativo))
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/fornecedores/lote/excluir")
def excluir_lote_fornecedores(event):
    try:
        body = json.loads(event.get("body") or "{}")
        ids = [int(i) for i in body.get("ids", [])]
        return ok(fornecedor_service.excluir_lote(ids))
    except Exception as exc:
        return server_error(str(exc))


# ── Caixa ─────────────────────────────────────────────────────────────────────

@router.route("GET", "/caixa")
def listar_lancamentos(_event):
    try:
        return ok(caixa_service.listar_lancamentos())
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/caixa/lote/excluir")
def excluir_lote_lancamentos(event):
    try:
        body = json.loads(event.get("body") or "{}")
        ids = [int(i) for i in body.get("ids", [])]
        return ok(caixa_service.excluir_lote(ids))
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/caixa")
def criar_lancamento(event):
    try:
        resultado = caixa_service.criar_lancamento(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/caixa/fluxo-projetado")
def listar_fluxo_projetado_route(_event):
    try:
        params = _event.get("queryStringParameters") or {}
        dias = int(params.get("dias", 30))
        return ok(caixa_service.listar_fluxo_projetado(dias))
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/caixa/{idLancamento}")
def buscar_lancamento(event):
    try:
        id_lancamento = int(event["pathParameters"]["idLancamento"])
        resultado = caixa_service.buscar_lancamento(id_lancamento)
        if not resultado:
            return not_found("Lançamento não encontrado")
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


@router.route("PUT", "/caixa/{idLancamento}")
def atualizar_lancamento(event):
    try:
        id_lancamento = int(event["pathParameters"]["idLancamento"])
        resultado = caixa_service.atualizar_lancamento(id_lancamento, event.get("body") or "{}")
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("DELETE", "/caixa/{idLancamento}")
def excluir_lancamento(event):
    try:
        id_lancamento = int(event["pathParameters"]["idLancamento"])
        return ok(caixa_service.excluir_lancamento(id_lancamento))
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


# ── Entry-point Lambda ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    return router.dispatch(event)


# Debug: Print registered routes
if __name__ == "__main__":
    print("\n=== Rotas Registradas ===")
    for method, path, handler in router._routes:
        print(f"{method:6} {path:40} -> {handler.__name__}")
    print("=" * 60)

