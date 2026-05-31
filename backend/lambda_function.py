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
        # Mensagem genérica por segurança (não revelar se foi email, ID ou senha)
        return unauthorized("Email, ID ou senha inválidos")
    
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


# ── Home Stats ───────────────────────────────────────────────────────────────

@router.route("GET", "/home/stats")
def home_stats(event):
    """Retorna estatísticas reais do sistema para a tela home, por tipo de usuário."""
    from app.src.adapters.db_adapter import execute_query as _q
    tipo = (event.get("queryStringParameters") or {}).get("tipo", "gestor")

    def _count(sql, params=None):
        rows = _q(sql, params) if params else _q(sql)
        if not rows:
            return 0
        v = list(rows[0].values())[0]
        return int(v) if v is not None else 0

    def _sum(sql, params=None):
        rows = _q(sql, params) if params else _q(sql)
        if not rows:
            return 0.0
        v = list(rows[0].values())[0]
        return float(v) if v is not None else 0.0

    try:
        total_matriculas  = _count("SELECT COUNT(*) FROM EducandoResponsavel WHERE tipoUsuario='educando' AND idStatus='Ativa'")
        turmas_ano_atual  = _count("SELECT COUNT(*) FROM Turmas WHERE anoLetivo = YEAR(CURDATE())")

        if tipo in ("gestor", "administrativo"):
            total_colaboradores = _count("SELECT COUNT(*) FROM Colaborador WHERE idStatus='ativo'")
            receita_mensal = _sum(
                "SELECT COALESCE(SUM(valorDespesa),0) FROM Caixa "
                "WHERE tipoOperacao='entrada' AND MONTH(data)=MONTH(CURDATE()) AND YEAR(data)=YEAR(CURDATE())"
            )
            stats = {
                "labels": ["Total de Matrículas", "Turmas Ativas", "Colaboradores", "Receita Mensal (R$)"],
                "valores": [total_matriculas, turmas_ano_atual, total_colaboradores, round(receita_mensal, 2)],
                "cores": ["azul", "verde", "laranja", "verde"],
                "icones": ["file-text", "users-class", "briefcase", "dollar"],
            }

        elif tipo == "educador":
            total_disciplinas = _count("SELECT COUNT(*) FROM Disciplinas")
            total_atividades  = _count("SELECT COUNT(*) FROM Atividades")
            stats = {
                "labels": ["Turmas no Ano", "Total de Matrículas", "Disciplinas", "Atividades"],
                "valores": [turmas_ano_atual, total_matriculas, total_disciplinas, total_atividades],
                "cores": ["azul", "verde", "roxo", "laranja"],
                "icones": ["users-class", "file-text", "book", "clipboard"],
            }

        elif tipo == "educando":
            media_geral = _sum("SELECT ROUND(AVG(notaEducando),1) FROM Notas")
            freq_media  = _sum(
                "SELECT ROUND(AVG(CASE WHEN prcFreq IS NOT NULL THEN prcFreq "
                "ELSE presenca*100 END),1) FROM Frequencia"
            )
            stats = {
                "labels": ["Média Geral", "Frequência (%)", "Turmas Disponíveis", "Total de Matrículas"],
                "valores": [round(media_geral, 1), round(freq_media, 1), turmas_ano_atual, total_matriculas],
                "cores": ["verde", "azul", "roxo", "laranja"],
                "icones": ["star", "check-circle", "users-class", "file-text"],
            }

        elif tipo == "responsavel":
            media_geral = _sum("SELECT ROUND(AVG(notaEducando),1) FROM Notas")
            freq_media  = _sum(
                "SELECT ROUND(AVG(CASE WHEN prcFreq IS NOT NULL THEN prcFreq "
                "ELSE presenca*100 END),1) FROM Frequencia"
            )
            stats = {
                "labels": ["Turmas Ativas", "Média de Notas", "Frequência Média (%)", "Total de Matrículas"],
                "valores": [turmas_ano_atual, round(media_geral, 1), round(freq_media, 1), total_matriculas],
                "cores": ["roxo", "azul", "verde", "laranja"],
                "icones": ["users-class", "activity", "check-circle", "file-text"],
            }

        elif tipo == "colaborador":
            movimentacoes_hoje = _count(
                "SELECT COUNT(*) FROM Caixa WHERE DATE(data)=CURDATE()"
            )
            saldo_mensal = _sum(
                "SELECT COALESCE(SUM(CASE WHEN tipoOperacao='entrada' THEN valorDespesa ELSE -valorDespesa END),0) "
                "FROM Caixa WHERE MONTH(data)=MONTH(CURDATE()) AND YEAR(data)=YEAR(CURDATE())"
            )
            stats = {
                "labels": ["Movimentações Hoje", "Saldo Mensal (R$)", "Matrículas Ativas", "Turmas no Ano"],
                "valores": [movimentacoes_hoje, round(saldo_mensal, 2), total_matriculas, turmas_ano_atual],
                "cores": ["azul", "verde", "laranja", "roxo"],
                "icones": ["credit-card", "dollar", "file-text", "users-class"],
            }

        else:
            stats = {
                "labels": ["Total de Matrículas", "Turmas no Ano"],
                "valores": [total_matriculas, turmas_ano_atual],
                "cores": ["azul", "verde"],
                "icones": ["file-text", "users-class"],
            }

        return ok({"stats": stats, "tipo": tipo})

    except Exception as exc:
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/home/perfil")
def home_perfil(event):
    """Retorna dados personalizados do usuário logado para a tela home."""
    from app.src.adapters.db_adapter import execute_query as _q
    qs = event.get("queryStringParameters") or {}
    tipo = qs.get("tipo", "gestor")
    matricula = qs.get("matricula", "")

    def _count(sql, params=None):
        rows = _q(sql, params) if params else _q(sql)
        v = list(rows[0].values())[0] if rows else 0
        return int(v) if v is not None else 0

    def _val(sql, params=None):
        rows = _q(sql, params) if params else _q(sql)
        v = list(rows[0].values())[0] if rows else None
        return v

    try:
        nome = None
        stats = []
        info = {}

        if tipo == "educando":
            # Nome real do educando
            r = _q("SELECT nomeCompleto FROM EducandoResponsavel WHERE idMatricula = %s LIMIT 1", (matricula,))
            nome = r[0]["nomeCompleto"] if r else None

            # Turma atual
            turma_rows = _q("""
                SELECT h.idTurma, h.situacao, h.serie, h.anoLetivo,
                       t.codTurma, t.nomeTurma, t.periodo
                FROM HistoricoEscolar h
                INNER JOIN Turmas t ON t.idTurma = h.idTurma
                WHERE h.idMatricula = %s AND h.idTurma IS NOT NULL
                ORDER BY h.anoLetivo DESC, h.idHistorico DESC LIMIT 1
            """, (matricula,))

            turma_info = None
            if turma_rows:
                tr = turma_rows[0]
                periodo_raw = (tr.get("periodo") or "").lower()
                if "matut" in periodo_raw or periodo_raw == "m": turno = "Manhã"
                elif "tard" in periodo_raw or "vespert" in periodo_raw or periodo_raw in ("v","t"): turno = "Tarde"
                elif "notur" in periodo_raw or periodo_raw == "n": turno = "Noite"
                elif "integral" in periodo_raw or periodo_raw == "i": turno = "Integral"
                else: turno = tr.get("periodo") or ""
                turma_info = f"{tr['nomeTurma']} · {turno}"
                id_turma = tr["idTurma"]

                # Média de notas do aluno nessa turma
                media_rows = _q("SELECT ROUND(AVG(notaEducando),1) AS media FROM Notas WHERE idMatricula = %s AND idTurma = %s", (matricula, id_turma))
                media = media_rows[0]["media"] if media_rows and media_rows[0]["media"] is not None else 0.0

                # Frequência do aluno
                freq_rows = _q("""
                    SELECT ROUND(AVG(CASE WHEN prcFreq IS NOT NULL THEN prcFreq ELSE presenca*100 END),1) AS freq
                    FROM Frequencia WHERE idMatricula = %s
                """, (matricula,))
                freq = freq_rows[0]["freq"] if freq_rows and freq_rows[0]["freq"] is not None else 0.0

                # Total de disciplinas na turma
                disc_count = _count("SELECT COUNT(*) FROM Notas WHERE idMatricula = %s AND idTurma = %s", (matricula, id_turma))
            else:
                media = 0.0; freq = 0.0; disc_count = 0

            stats = [
                {"label": "Média Geral", "valor": float(media), "cor": "verde", "icone": "star", "sufixo": ""},
                {"label": "Frequência", "valor": float(freq), "cor": "azul", "icone": "check-circle", "sufixo": "%"},
                {"label": "Disciplinas", "valor": disc_count, "cor": "roxo", "icone": "book", "sufixo": ""},
            ]
            info = {"turma": turma_info, "serie": turma_rows[0]["serie"] if turma_rows else None}

        elif tipo in ("educador", "colaborador"):
            # Educadores em Educador; colaboradores em Colaborador
            if tipo == "educador":
                r = _q("SELECT nomeCompleto FROM Educador WHERE idMatricula = %s LIMIT 1", (matricula,))
            else:
                r = _q("SELECT nomeCompleto FROM Colaborador WHERE idMatricula = %s LIMIT 1", (matricula,))
            nome = r[0]["nomeCompleto"] if r else None

            if tipo == "educador":
                turmas_count = _count("SELECT COUNT(*) FROM Turmas WHERE anoLetivo = YEAR(CURDATE())")
                matriculas_count = _count("SELECT COUNT(*) FROM EducandoResponsavel WHERE tipoUsuario='educando' AND idStatus='Ativa'")
                disc_count = _count("SELECT COUNT(*) FROM Disciplinas")
                stats = [
                    {"label": "Turmas Ativas", "valor": turmas_count, "cor": "azul", "icone": "users-class", "sufixo": ""},
                    {"label": "Educandos Ativos", "valor": matriculas_count, "cor": "verde", "icone": "file-text", "sufixo": ""},
                    {"label": "Disciplinas", "valor": disc_count, "cor": "roxo", "icone": "book", "sufixo": ""},
                ]
            else:
                movs = _count("SELECT COUNT(*) FROM Caixa WHERE DATE(dataMovimento)=CURDATE()")
                saldo_rows = _q("""
                    SELECT COALESCE(SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END),0) AS saldo
                    FROM Caixa WHERE MONTH(dataMovimento)=MONTH(CURDATE()) AND YEAR(dataMovimento)=YEAR(CURDATE())
                """)
                saldo = float(saldo_rows[0]["saldo"]) if saldo_rows else 0.0
                matriculas_count = _count("SELECT COUNT(*) FROM EducandoResponsavel WHERE tipoUsuario='educando' AND idStatus='Ativa'")
                stats = [
                    {"label": "Movimentações Hoje", "valor": movs, "cor": "azul", "icone": "credit-card", "sufixo": ""},
                    {"label": "Saldo Mensal", "valor": round(saldo, 2), "cor": "verde", "icone": "dollar", "sufixo": ""},
                    {"label": "Matrículas Ativas", "valor": matriculas_count, "cor": "laranja", "icone": "file-text", "sufixo": ""},
                ]

        elif tipo == "responsavel":
            r = _q("SELECT nomeCompleto FROM EducandoResponsavel WHERE cpfResponsavel = %s OR idMatricula = %s LIMIT 1", (matricula, matricula))
            nome = r[0]["nomeCompleto"] if r else None

            matriculas_count = _count("SELECT COUNT(*) FROM EducandoResponsavel WHERE tipoUsuario='educando' AND idStatus='Ativa'")
            turmas_count = _count("SELECT COUNT(*) FROM Turmas WHERE anoLetivo = YEAR(CURDATE())")
            media_geral = _val("SELECT ROUND(AVG(notaEducando),1) FROM Notas")
            stats = [
                {"label": "Turmas Ativas", "valor": turmas_count, "cor": "roxo", "icone": "users-class", "sufixo": ""},
                {"label": "Média Geral da Escola", "valor": float(media_geral) if media_geral else 0.0, "cor": "verde", "icone": "star", "sufixo": ""},
                {"label": "Matrículas Ativas", "valor": matriculas_count, "cor": "laranja", "icone": "file-text", "sufixo": ""},
            ]

        elif tipo in ("gestor", "administrativo"):
            r = _q("SELECT nomeCompleto FROM Colaborador WHERE idMatricula = %s LIMIT 1", (matricula,))
            nome = r[0]["nomeCompleto"] if r else None

            matriculas_count = _count("SELECT COUNT(*) FROM EducandoResponsavel WHERE tipoUsuario='educando' AND idStatus='Ativa'")
            turmas_count = _count("SELECT COUNT(*) FROM Turmas WHERE anoLetivo = YEAR(CURDATE())")
            colaboradores_count = _count("SELECT COUNT(*) FROM Colaborador WHERE idStatus = 'ativo'")
            receita_rows = _q("""
                SELECT COALESCE(SUM(valorDespesa),0) AS receita FROM Caixa
                WHERE tipoOperacao='entrada' AND MONTH(data)=MONTH(CURDATE()) AND YEAR(data)=YEAR(CURDATE())
            """)
            receita = float(receita_rows[0]["receita"]) if receita_rows else 0.0
            stats = [
                {"label": "Matrículas Ativas", "valor": matriculas_count, "cor": "azul", "icone": "file-text", "sufixo": ""},
                {"label": "Turmas Ativas", "valor": turmas_count, "cor": "verde", "icone": "users-class", "sufixo": ""},
                {"label": "Colaboradores", "valor": colaboradores_count, "cor": "laranja", "icone": "briefcase", "sufixo": ""},
                {"label": "Receita Mensal", "valor": round(receita, 2), "cor": "roxo", "icone": "dollar", "sufixo": ""},
            ]

        return ok({"nome": nome, "stats": stats, "info": info})

    except Exception as exc:
        import traceback; traceback.print_exc()
        return server_error(str(exc))


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


@router.route("GET", "/periodos-letivos")
def listar_periodos_letivos_route(event):
    """Lista todos os períodos letivos (bimestres, semestres, ano letivo)"""
    try:
        from app.src.models.models import PeriodoLetivoModel
        
        query_params = event.get("queryStringParameters") or {}
        ano_letivo = query_params.get("anoLetivo")
        status = query_params.get("status")
        
        ano_letivo_int = int(ano_letivo) if ano_letivo else None
        periodos = PeriodoLetivoModel.find_all(ano_letivo=ano_letivo_int, status=status)
        
        return ok({
            "success": True,
            "data": periodos,
            "total": len(periodos)
        })
    except Exception as exc:
        print(f"[ERROR listar_periodos_letivos] {exc}")
        import traceback
        traceback.print_exc()
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
        
        turno = query_params.get("turno")
        if disciplina_id:
            resultado = educadores_service.listar_educadores_por_disciplina(
                int(disciplina_id),
                status=status,
                turno=turno
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


@router.route("GET", "/cronograma/turmas-educador/{idEducador}")
def turmas_educador_cronograma(event):
    """Turmas e disciplinas onde o educador tem aulas agendadas no Cronograma"""
    try:
        id_educador = event["pathParameters"]["idEducador"]
        from app.src.adapters.db_adapter import execute_query

        rows = execute_query(
            """
            SELECT DISTINCT c.idTurma, c.idDisciplina,
                   d.nomeDisciplina, d.codDisciplina
            FROM Cronograma c
            JOIN Disciplinas d ON c.idDisciplina = d.idDisciplina
            WHERE c.idEducador = %s AND c.status = 'ativa'
            ORDER BY c.idTurma
            """,
            (id_educador,)
        )

        turmas_map = {}
        for row in rows:
            id_turma = row["idTurma"]
            if id_turma not in turmas_map:
                turma_info = turmas_service.buscar_turma(id_turma)
                if turma_info:
                    turmas_map[id_turma] = {**turma_info, "disciplinas": []}
            if id_turma in turmas_map:
                turmas_map[id_turma]["disciplinas"].append({
                    "idDisciplina": row["idDisciplina"],
                    "nomeDisciplina": row["nomeDisciplina"],
                    "codDisciplina": row.get("codDisciplina", ""),
                })

        return ok(list(turmas_map.values()))
    except Exception as exc:
        print(f"[ERROR turmas_educador_cronograma] {exc}")
        import traceback; traceback.print_exc()
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
        
        # Buscar educador
        educador = educador_service.buscar_educador(matricula)
        if not educador:
            return not_found("Educador não encontrado")
        
        # Buscar disciplinas do educador (com turmas)
        disciplinas = EducadorDisciplinaModel.find_by_educador(matricula)
        
        # Agrupar por turma
        turmas_map = {}
        for disc in disciplinas:
            id_turma = disc.get('idTurma')
            if not id_turma:
                continue
                
            if id_turma not in turmas_map:
                turma_info = turmas_service.buscar_turma(id_turma)
                if turma_info:
                    turmas_map[id_turma] = {
                        **turma_info,
                        'disciplinas': []
                    }
            
            if id_turma in turmas_map:
                turmas_map[id_turma]['disciplinas'].append({
                    'idDisciplina': disc.get('idDisciplina'),
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
    """Lista educandos matriculados em uma turma via SQL direto"""
    try:
        from app.src.adapters.db_adapter import execute_query
        id_turma = int(event["pathParameters"]["idTurma"])

        # Busca educandos pelo HistoricoEscolar vinculado à turma
        rows = execute_query("""
            SELECT h.idMatricula, h.situacao,
                   er.nomeCompleto, er.idMatricula AS matriculaEducando
            FROM HistoricoEscolar h
            JOIN EducandoResponsavel er ON h.idMatricula = er.idMatricula
            WHERE h.idTurma = %s AND LOWER(h.situacao) = 'cursando'
            ORDER BY er.nomeCompleto
        """, (id_turma,))

        educandos = [
            {
                "idMatricula": r["idMatricula"],
                "nomeCompleto": r["nomeCompleto"],
                "status": r["situacao"],
            }
            for r in rows
        ]
        return ok({"data": educandos, "total": len(educandos)})

    except Exception as exc:
        print(f"[ERROR listar_educandos_turma] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


# ── Frequência ────────────────────────────────────────────────────────────────

@router.route("POST", "/frequencia")
def registrar_frequencia(event):
    """Registra/atualiza frequência de uma aula via SQL direto"""
    try:
        from app.src.adapters.db_adapter import execute_query, execute_write

        body = json.loads(event.get("body") or "{}")
        id_turma     = body.get("idTurma")
        id_disciplina = body.get("idDisciplina")
        id_educador  = body.get("idEducador")
        data_aula    = body.get("data")
        registros    = body.get("registros", [])

        if not all([id_turma, id_disciplina, data_aula, registros]):
            return error("idTurma, idDisciplina, data e registros são obrigatórios")

        # DELETE em lote para todos os alunos desta aula (evita registros duplicados
        # que ocorrem quando o SELECT do upsert falha por conversão de tipo)
        ids_mat = [str(r.get("idMatricula", "")) for r in registros if r.get("idMatricula")]
        if ids_mat:
            placeholders = ",".join(["%s"] * len(ids_mat))
            execute_write(
                f"DELETE FROM Frequencia WHERE idDisciplina=%s AND data=%s AND idMatricula IN ({placeholders})",
                (id_disciplina, data_aula, *ids_mat)
            )

        # INSERT de todos os registros de uma vez (sem duplicatas possíveis)
        salvos = 0
        for reg in registros:
            id_mat = str(reg.get("idMatricula", ""))
            status = str(reg.get("status", "presente"))
            if not id_mat:
                continue
            execute_write(
                "INSERT INTO Frequencia (idMatricula, idDisciplina, data, presenca, prcFreq) VALUES (%s,%s,%s,%s,%s)",
                (id_mat, id_disciplina, data_aula, status, 0)
            )
            salvos += 1

        return ok({"success": True, "message": f"{salvos} registro(s) salvos"})

    except Exception as exc:
        print(f"[ERROR registrar_frequencia] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/frequencia")
def buscar_frequencia(event):
    """Busca frequência de uma aula específica.
    Usa subquery para obter lista distinta de alunos e evitar duplicações
    causadas por múltiplos registros em HistoricoEscolar.
    """
    try:
        from app.src.adapters.db_adapter import execute_query

        params        = event.get("queryStringParameters") or {}
        id_turma      = params.get("idTurma")
        id_disciplina = params.get("idDisciplina")
        data_aula     = params.get("data")

        if not all([id_turma, id_disciplina, data_aula]):
            return error("idTurma, idDisciplina e data são obrigatórios")

        # Lista distinta de alunos ativos na turma
        alunos = execute_query("""
            SELECT DISTINCT h.idMatricula, er.nomeCompleto
            FROM HistoricoEscolar h
            JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idTurma = %s AND LOWER(h.situacao) = 'cursando'
            ORDER BY er.nomeCompleto
        """, (id_turma,))

        if not alunos:
            return ok({"registros": [], "total": 0})

        ids = [str(a["idMatricula"]) for a in alunos]
        placeholders = ",".join(["%s"] * len(ids))

        # Frequência registrada para essa data/disciplina
        freq_rows = execute_query(f"""
            SELECT idMatricula, presenca
            FROM Frequencia
            WHERE idDisciplina = %s AND data = %s AND idMatricula IN ({placeholders})
        """, (id_disciplina, data_aula, *ids))

        freq_map = {str(r["idMatricula"]): r["presenca"] for r in freq_rows}

        registros = [
            {
                "idMatricula":  a["idMatricula"],
                "nomeEducando": a["nomeCompleto"],
                "status":       freq_map.get(str(a["idMatricula"])) or None,
            }
            for a in alunos
        ]
        return ok({"registros": registros, "total": len(registros)})

    except Exception as exc:
        print(f"[ERROR buscar_frequencia] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/frequencia/datas")
def listar_datas_frequencia(event):
    """Lista datas com frequência registrada para turma+disciplina"""
    try:
        from app.src.adapters.db_adapter import execute_query

        params = event.get("queryStringParameters") or {}
        id_turma     = params.get("idTurma")
        id_disciplina = params.get("idDisciplina")

        if not all([id_turma, id_disciplina]):
            return error("idTurma e idDisciplina são obrigatórios")

        rows = execute_query("""
            SELECT DISTINCT f.data
            FROM Frequencia f
            JOIN HistoricoEscolar h ON h.idMatricula = f.idMatricula
            WHERE f.idDisciplina = %s AND h.idTurma = %s
            ORDER BY f.data
        """, (id_disciplina, id_turma))

        datas = [str(r["data"]) for r in rows]
        return ok({"datas": datas})

    except Exception as exc:
        print(f"[ERROR listar_datas_frequencia] {exc}")
        return server_error(str(exc))


@router.route("GET", "/frequencia/relatorio/datas")
def relatorio_datas_frequencia(event):
    """Datas com contagens de presença/ausência/justificado por turma+disciplina.
    Usa subquery IN para evitar multiplicação de linhas por múltiplos registros
    históricos do mesmo aluno em HistoricoEscolar.
    """
    try:
        from app.src.adapters.db_adapter import execute_query

        params        = event.get("queryStringParameters") or {}
        id_turma      = params.get("idTurma")
        id_disciplina = params.get("idDisciplina")

        if not all([id_turma, id_disciplina]):
            return error("idTurma e idDisciplina são obrigatórios")

        rows = execute_query("""
            SELECT f.data,
                   SUM(CASE WHEN f.presenca = 'presente'    THEN 1 ELSE 0 END) AS presentes,
                   SUM(CASE WHEN f.presenca = 'ausente'     THEN 1 ELSE 0 END) AS ausentes,
                   SUM(CASE WHEN f.presenca = 'justificado' THEN 1 ELSE 0 END) AS justificados
            FROM Frequencia f
            WHERE f.idDisciplina = %s
              AND f.idMatricula IN (
                  SELECT DISTINCT h.idMatricula
                  FROM HistoricoEscolar h
                  WHERE h.idTurma = %s AND LOWER(h.situacao) = 'cursando'
              )
            GROUP BY f.data
            ORDER BY f.data
        """, (id_disciplina, id_turma))

        return ok({
            "datas": [
                {
                    "data":         str(r["data"]),
                    "presentes":    int(r["presentes"] or 0),
                    "ausentes":     int(r["ausentes"]  or 0),
                    "justificados": int(r["justificados"] or 0),
                }
                for r in rows
            ]
        })

    except Exception as exc:
        print(f"[ERROR relatorio_datas_frequencia] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/frequencia/relatorio/turma/{idTurma}")
def relatorio_frequencia_turma(event):
    """Resumo agregado de frequência por educando na turma.
    Usa subquery para obter lista distinta de alunos, evitando multiplicação
    causada por múltiplos registros em HistoricoEscolar para o mesmo aluno.
    """
    try:
        from app.src.adapters.db_adapter import execute_query

        id_turma      = event["pathParameters"]["idTurma"]
        params        = event.get("queryStringParameters") or {}
        id_disciplina = params.get("idDisciplina")

        # Alunos ativos na turma (distinct para ignorar múltiplos históricos)
        alunos = execute_query("""
            SELECT DISTINCT h.idMatricula, er.nomeCompleto
            FROM HistoricoEscolar h
            JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idTurma = %s AND LOWER(h.situacao) = 'cursando'
            ORDER BY er.nomeCompleto
        """, (id_turma,))

        if not alunos:
            return ok([])

        ids = [str(a["idMatricula"]) for a in alunos]
        placeholders = ",".join(["%s"] * len(ids))

        # Frequência agregada por aluno (sem JOIN com HistoricoEscolar)
        freq_rows = execute_query(f"""
            SELECT idMatricula,
                   COUNT(*)  AS total,
                   SUM(CASE WHEN presenca = 'presente'    THEN 1 ELSE 0 END) AS presentes,
                   SUM(CASE WHEN presenca = 'ausente'     THEN 1 ELSE 0 END) AS ausentes,
                   SUM(CASE WHEN presenca = 'justificado' THEN 1 ELSE 0 END) AS justificados
            FROM Frequencia
            WHERE idDisciplina = %s AND idMatricula IN ({placeholders})
            GROUP BY idMatricula
        """, (id_disciplina, *ids))

        # Indexa por idMatricula para join rápido
        freq_map = {str(r["idMatricula"]): r for r in freq_rows}

        resultado = []
        for a in alunos:
            mid  = str(a["idMatricula"])
            freq = freq_map.get(mid)
            presentes    = int(freq["presentes"]    or 0) if freq else 0
            ausentes     = int(freq["ausentes"]     or 0) if freq else 0
            justificados = int(freq["justificados"] or 0) if freq else 0
            total        = int(freq["total"]        or 0) if freq else 0
            pct = min(100, round((presentes + justificados) / total * 100)) if total > 0 else 100
            resultado.append({
                "idMatricula":  mid,
                "nome":         a["nomeCompleto"],
                "total":        total,
                "presentes":    presentes,
                "ausentes":     ausentes,
                "justificados": justificados,
                "pct":          pct,
            })

        return ok(resultado)

    except Exception as exc:
        print(f"[ERROR relatorio_frequencia_turma] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/frequencia/relatorio/educando/{idMatricula}")
def relatorio_frequencia_educando(event):
    """Frequência de um educando específico"""
    try:
        from app.src.adapters.db_adapter import execute_query

        id_matricula  = event["pathParameters"]["idMatricula"]
        params        = event.get("queryStringParameters") or {}
        id_disciplina = params.get("idDisciplina")

        rows = execute_query("""
            SELECT data, presenca FROM Frequencia
            WHERE idMatricula = %s AND idDisciplina = %s
            ORDER BY data
        """, (id_matricula, id_disciplina))

        return ok({"registros": [{"data": str(r["data"]), "presenca": r["presenca"]} for r in rows]})

    except Exception as exc:
        print(f"[ERROR relatorio_frequencia_educando] {exc}")
        return server_error(str(exc))


# ── Atividades ────────────────────────────────────────────────────────────────

@router.route("GET", "/atividades")
def listar_atividades(event):
    """Lista atividades de uma turma/disciplina"""
    try:
        from app.src.adapters.db_adapter import execute_query
        params = event.get("queryStringParameters") or {}
        id_disciplina = int(params.get("idDisciplina", 0))
        if not id_disciplina:
            return error("idDisciplina obrigatório")

        rows = execute_query("""
            SELECT idAtividade, idDisciplina, atividade AS nome, tipoAtividade AS tipo,
                   dataAtividade, notaMax AS notaMaxima
            FROM Atividades
            WHERE idDisciplina = %s
            ORDER BY dataAtividade, idAtividade
        """, (id_disciplina,))

        def _fmt_at(r):
            r = dict(r)
            if r.get("dataAtividade"):
                v = r["dataAtividade"]
                r["dataAtividade"] = v.strftime("%Y-%m-%d") if hasattr(v, "strftime") else str(v)
            if r.get("notaMaxima") is not None:
                r["notaMaxima"] = float(r["notaMaxima"])
            return r

        return ok([_fmt_at(r) for r in rows])

    except Exception as exc:
        print(f"[ERROR listar_atividades] {exc}")
        return server_error(str(exc))


@router.route("POST", "/atividades")
def criar_atividade(event):
    """Cria uma nova atividade avaliativa"""
    try:
        from app.src.adapters.db_adapter import execute_query, execute_write
        body = json.loads(event.get("body") or "{}")
        id_disciplina  = body.get("idDisciplina")
        nome           = (body.get("nome") or "").strip()
        tipo           = body.get("tipo", "Prova")
        data_atividade = body.get("dataAtividade") or body.get("data")
        nota_max       = float(body.get("notaMaxima", 10))

        if not id_disciplina:
            return error("idDisciplina obrigatório")
        if not nome:
            return error("Nome da atividade é obrigatório")
        if not data_atividade:
            return error("Data é obrigatória")

        execute_write("""
            INSERT INTO Atividades (idDisciplina, atividade, tipoAtividade, dataAtividade, notaMax)
            VALUES (%s, %s, %s, %s, %s)
        """, (id_disciplina, nome, tipo, data_atividade, nota_max))

        novo = execute_query(
            "SELECT idAtividade FROM Atividades WHERE idDisciplina=%s ORDER BY idAtividade DESC LIMIT 1",
            (id_disciplina,)
        )
        id_atividade = novo[0]["idAtividade"] if novo else None
        return ok({"success": True, "idAtividade": id_atividade, "message": "Atividade criada"})

    except Exception as exc:
        print(f"[ERROR criar_atividade] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("DELETE", "/atividades/{idAtividade}")
def excluir_atividade(event):
    """Exclui uma atividade e suas notas"""
    try:
        from app.src.adapters.db_adapter import execute_write
        id_atividade = int(event["pathParameters"]["idAtividade"])
        execute_write("DELETE FROM Notas WHERE idAtividade=%s", (id_atividade,))
        execute_write("DELETE FROM Atividades WHERE idAtividade=%s", (id_atividade,))
        return ok({"success": True, "message": "Atividade removida"})
    except Exception as exc:
        print(f"[ERROR excluir_atividade] {exc}")
        return server_error(str(exc))


# ── Notas ─────────────────────────────────────────────────────────────────────

@router.route("GET", "/notas/atividade/{idAtividade}")
def buscar_notas_atividade(event):
    """Busca notas de todos educandos da turma em uma atividade"""
    try:
        from app.src.adapters.db_adapter import execute_query
        id_atividade = int(event["pathParameters"]["idAtividade"])
        params = event.get("queryStringParameters") or {}
        id_turma = int(params.get("idTurma", 0))

        # Info da atividade
        at_rows = execute_query("""
            SELECT idAtividade, idDisciplina, atividade AS nome, tipoAtividade AS tipo,
                   dataAtividade, notaMax AS notaMaxima
            FROM Atividades WHERE idAtividade=%s
        """, (id_atividade,))
        if not at_rows:
            return not_found("Atividade não encontrada")
        atividade = dict(at_rows[0])
        if atividade.get("dataAtividade"):
            v = atividade["dataAtividade"]
            atividade["dataAtividade"] = v.strftime("%Y-%m-%d") if hasattr(v, "strftime") else str(v)
        atividade["notaMaxima"] = float(atividade["notaMaxima"] or 10)
        id_disciplina = atividade["idDisciplina"]

        # Alunos da turma
        alunos = execute_query("""
            SELECT DISTINCT h.idMatricula, er.nomeCompleto
            FROM HistoricoEscolar h
            JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idTurma=%s AND LOWER(h.situacao)='cursando'
            ORDER BY er.nomeCompleto
        """, (id_turma,))

        if not alunos:
            return ok({"atividade": atividade, "notas": []})

        ids = [str(a["idMatricula"]) for a in alunos]
        placeholders = ",".join(["%s"] * len(ids))

        notas_rows = execute_query(f"""
            SELECT idMatricula, notaEducando
            FROM Notas
            WHERE idAtividade=%s AND idMatricula IN ({placeholders})
        """, (id_atividade, *ids))

        nota_map = {str(r["idMatricula"]): (float(r["notaEducando"]) if r["notaEducando"] is not None else None)
                    for r in notas_rows}

        notas = [{"idMatricula": str(a["idMatricula"]), "nome": a["nomeCompleto"],
                  "nota": nota_map.get(str(a["idMatricula"]))} for a in alunos]

        return ok({"atividade": atividade, "notas": notas})

    except Exception as exc:
        print(f"[ERROR buscar_notas_atividade] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("POST", "/notas")
def lancar_notas(event):
    """Lança/atualiza notas de múltiplos educandos em uma atividade"""
    try:
        from app.src.adapters.db_adapter import execute_query, execute_write
        body = json.loads(event.get("body") or "{}")
        id_atividade  = body.get("idAtividade")
        id_turma      = body.get("idTurma")
        id_disciplina = body.get("idDisciplina")
        notas         = body.get("notas", [])

        if not all([id_atividade, id_turma, id_disciplina]):
            return error("idAtividade, idTurma e idDisciplina são obrigatórios")

        at = execute_query("SELECT notaMax FROM Atividades WHERE idAtividade=%s", (id_atividade,))
        if not at:
            return not_found("Atividade não encontrada")
        nota_max = float(at[0]["notaMax"] or 10)

        for n in notas:
            v = n.get("nota")
            if v is not None and str(v).strip() != "":
                try:
                    vf = float(v)
                    if vf < 0 or vf > nota_max:
                        return error(f"Nota deve estar entre 0 e {nota_max}")
                except (TypeError, ValueError):
                    return error("Valor de nota inválido")

        ids_alunos = [str(n["idMatricula"]) for n in notas if n.get("idMatricula")]
        if ids_alunos:
            ph = ",".join(["%s"] * len(ids_alunos))
            execute_write(f"DELETE FROM Notas WHERE idAtividade=%s AND idMatricula IN ({ph})",
                          (id_atividade, *ids_alunos))

        count = 0
        for n in notas:
            id_mat = str(n.get("idMatricula", ""))
            if not id_mat:
                continue
            nota_val = n.get("nota")
            nota_float = float(nota_val) if (nota_val is not None and str(nota_val).strip() != "") else None
            execute_write("""
                INSERT INTO Notas (idMatricula, idDisciplina, idAtividade, idTurma, notaEducando)
                VALUES (%s, %s, %s, %s, %s)
            """, (id_mat, id_disciplina, id_atividade, id_turma, nota_float))
            count += 1

        return ok({"success": True, "message": f"Notas salvas para {count} educando(s)", "count": count})

    except Exception as exc:
        print(f"[ERROR lancar_notas] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/notas/educando/{idMatricula}")
def buscar_notas_educando(event):
    """Busca notas de um educando em uma disciplina"""
    try:
        from app.src.adapters.db_adapter import execute_query
        id_matricula = str(event["pathParameters"]["idMatricula"])
        params = event.get("queryStringParameters") or {}
        id_disciplina = int(params.get("idDisciplina", 0))

        rows = execute_query("""
            SELECT n.idAtividade, a.atividade AS nome, a.tipoAtividade AS tipo,
                   a.dataAtividade, a.notaMax AS notaMaxima, n.notaEducando AS nota
            FROM Notas n
            JOIN Atividades a ON a.idAtividade = n.idAtividade
            WHERE n.idMatricula=%s AND n.idDisciplina=%s
            ORDER BY a.dataAtividade, a.idAtividade
        """, (id_matricula, id_disciplina))

        def _fmt_n(r):
            r = dict(r)
            if r.get("dataAtividade"):
                v = r["dataAtividade"]
                r["dataAtividade"] = v.strftime("%Y-%m-%d") if hasattr(v, "strftime") else str(v)
            if r.get("notaMaxima") is not None:
                r["notaMaxima"] = float(r["notaMaxima"])
            if r.get("nota") is not None:
                r["nota"] = float(r["nota"])
            return r

        return ok([_fmt_n(r) for r in rows])

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


# ── Dashboard de desempenho ────────────────────────────────────────────────────

@router.route("GET", "/notas/dashboard")
def dashboard_desempenho(event):
    """Dashboard completo: estatísticas por atividade + geral + por aluno"""
    try:
        from app.src.adapters.db_adapter import execute_query
        import math

        params = event.get("queryStringParameters") or {}
        id_disciplina = int(params.get("idDisciplina", 0))
        id_turma      = int(params.get("idTurma", 0))

        if not id_disciplina or not id_turma:
            return error("idDisciplina e idTurma são obrigatórios")

        # ── Alunos da turma ───────────────────────────────────────────────────
        alunos = execute_query("""
            SELECT DISTINCT h.idMatricula, er.nomeCompleto
            FROM HistoricoEscolar h
            JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idTurma=%s AND LOWER(h.situacao)='cursando'
            ORDER BY er.nomeCompleto
        """, (id_turma,))
        if not alunos:
            return ok({"atividades": [], "geral": None, "alunos": []})

        ids_alunos = [str(a["idMatricula"]) for a in alunos]
        nome_map   = {str(a["idMatricula"]): a["nomeCompleto"] for a in alunos}
        total_turma = len(ids_alunos)

        # ── Atividades da disciplina ──────────────────────────────────────────
        atividades = execute_query("""
            SELECT idAtividade, atividade AS nome, tipoAtividade AS tipo,
                   dataAtividade, notaMax AS notaMaxima, notaMinima
            FROM Atividades WHERE idDisciplina=%s
            ORDER BY dataAtividade, idAtividade
        """, (id_disciplina,))

        if not atividades:
            return ok({"atividades": [], "geral": None, "alunos": []})

        ph = ",".join(["%s"] * len(ids_alunos))

        def _stats(notas_float, nota_max, nota_min_aprov):
            """Calcula média, mediana, moda, aprovação e distribuição."""
            n = len(notas_float)
            if n == 0:
                return {
                    "media": None, "mediana": None, "moda": [],
                    "aprovados": 0, "reprovados": 0, "taxaAprovacao": None,
                    "distribuicao": []
                }
            s = sorted(notas_float)
            media = round(sum(s) / n, 2)
            # mediana
            mid = n // 2
            mediana = round(s[mid] if n % 2 else (s[mid-1]+s[mid])/2, 2)
            # moda
            from collections import Counter
            freq = Counter(s)
            max_freq = max(freq.values())
            moda = sorted(set(v for v, c in freq.items() if c == max_freq))
            # aprovação
            aprovados = sum(1 for v in s if v >= nota_min_aprov)
            reprovados = n - aprovados
            taxa = round(aprovados / n * 100, 1)
            # distribuição em 5 faixas
            step = nota_max / 5
            faixas = []
            for i in range(5):
                lo = round(i * step, 1)
                hi = round((i+1) * step, 1)
                count = sum(1 for v in s if (lo <= v < hi) or (i == 4 and v == nota_max))
                faixas.append({"faixa": f"{lo:.1f}–{hi:.1f}", "lo": lo, "hi": hi, "count": count})
            return {
                "media": media, "mediana": mediana,
                "moda": moda[:3],  # max 3 modas
                "aprovados": aprovados, "reprovados": reprovados,
                "taxaAprovacao": taxa,
                "distribuicao": faixas
            }

        # ── Por atividade ─────────────────────────────────────────────────────
        atividades_dashboard = []
        # Para acumular notas de todos os alunos em todas as atividades (por aluno)
        notas_por_aluno: dict[str, list[float]] = {id_: [] for id_ in ids_alunos}

        for at in atividades:
            id_at    = at["idAtividade"]
            nota_max = float(at["notaMaxima"] or 10)
            nota_min = float(at["notaMinima"]) if at.get("notaMinima") else nota_max * 0.6

            notas_rows = execute_query(f"""
                SELECT idMatricula, notaEducando
                FROM Notas
                WHERE idAtividade=%s AND idMatricula IN ({ph})
            """, (id_at, *ids_alunos))

            nota_map_at = {str(r["idMatricula"]): float(r["notaEducando"])
                           for r in notas_rows if r["notaEducando"] is not None}

            notas_vals = list(nota_map_at.values())
            stats = _stats(notas_vals, nota_max, nota_min)

            # Acumula por aluno
            for id_mat, nota_v in nota_map_at.items():
                if id_mat in notas_por_aluno:
                    notas_por_aluno[id_mat].append(nota_v)

            dt = at.get("dataAtividade")
            atividades_dashboard.append({
                "idAtividade": id_at,
                "nome": at["nome"],
                "tipo": at["tipo"],
                "dataAtividade": dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt) if dt else None,
                "notaMaxima": nota_max,
                "notaMinima": nota_min,
                "totalAlunos": total_turma,
                "avaliados": len(notas_vals),
                **stats
            })

        # ── Por aluno (média geral) ───────────────────────────────────────────
        alunos_dashboard = []
        todas_medias = []
        for id_mat in ids_alunos:
            notas_al = notas_por_aluno[id_mat]
            if notas_al:
                media_al = round(sum(notas_al) / len(notas_al), 2)
                todas_medias.append(media_al)
            else:
                media_al = None
            # nota mínima de aprovação (média das nota_min das atividades)
            nota_min_geral = (sum(
                float(a.get("notaMinima") or (float(a["notaMaxima"] or 10) * 0.6))
                for a in atividades
            ) / len(atividades)) if atividades else 6.0
            alunos_dashboard.append({
                "idMatricula": id_mat,
                "nome": nome_map.get(id_mat, id_mat),
                "mediaGeral": media_al,
                "notas": notas_por_aluno[id_mat],
                "aprovado": (media_al is not None and media_al >= nota_min_geral)
            })

        # ── Geral da turma ────────────────────────────────────────────────────
        nota_min_geral = (sum(
            float(a.get("notaMinima") or (float(a["notaMaxima"] or 10) * 0.6))
            for a in atividades
        ) / len(atividades)) if atividades else 6.0

        nota_max_geral = float(atividades[0]["notaMaxima"] or 10) if atividades else 10.0
        geral_stats = _stats(todas_medias, nota_max_geral, nota_min_geral)

        return ok({
            "atividades": atividades_dashboard,
            "geral": {
                "totalAlunos": total_turma,
                "avaliados": len(todas_medias),
                **geral_stats
            },
            "alunos": alunos_dashboard
        })

    except Exception as exc:
        print(f"[ERROR dashboard_desempenho] {exc}")
        import traceback; traceback.print_exc()
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
        from app.src.models.models import CronogramaModel
        from app.src.adapters.db_adapter import execute_query

        id_matricula = event["pathParameters"]["idMatricula"]

        # Busca a turma mais recente do educando diretamente — seleciona
        # explicitamente h.idTurma para evitar colisão de nomes com JOIN.
        turma_rows = execute_query(
            """
            SELECT h.idTurma,
                   t.codTurma, t.nomeTurma, t.periodo, t.anoLetivo,
                   h.situacao, h.serie, h.anoLetivo AS hAnoLetivo
            FROM HistoricoEscolar h
            JOIN Turmas t ON t.idTurma = h.idTurma
            WHERE h.idMatricula = %s
              AND h.idTurma IS NOT NULL
            ORDER BY h.anoLetivo DESC, h.idHistorico DESC
            LIMIT 1
            """,
            (id_matricula,)
        )

        if not turma_rows:
            # Fallback: talvez o educando exista mas sem turma vinculada
            return ok({"horarios": [], "turma": None,
                       "message": "Educando não possui turma ativa"})

        turma = turma_rows[0]
        id_turma = turma["idTurma"]

        # Buscar cronograma da turma com joins completos
        horarios = CronogramaModel.find_by_turma(id_turma)

        # Normalizar horaInicio/horaFim para HH:MM
        for h in horarios:
            for campo in ("horaInicio", "horaFim"):
                val = h.get(campo, "") or ""
                partes = str(val).split(":")
                if len(partes) >= 2:
                    h[campo] = partes[0].zfill(2) + ":" + partes[1].zfill(2)

        return ok({
            "horarios": horarios,
            "turma": {
                "idTurma":   id_turma,
                "codTurma":  turma.get("codTurma") or "",
                "nomeTurma": turma.get("nomeTurma") or "",
                "periodo":   turma.get("periodo") or "",
                "anoLetivo": turma.get("anoLetivo") or turma.get("hAnoLetivo") or "",
            }
        })
    except Exception as exc:
        print(f"[ERROR cronograma_educando] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))



@router.route("GET", "/cronograma/responsavel/{idResponsavel}")
def cronograma_responsavel(event):
    """Visão do responsável - grade horária de todos os filhos"""
    try:
        from app.src.adapters.db_adapter import execute_query
        from app.src.models.models import CronogramaModel

        id_responsavel = event["pathParameters"]["idResponsavel"]

        def _norm_hora(val):
            """'7:00:00' ou '07:00:00' → '07:00'"""
            s = str(val or "")
            partes = s.split(":")
            if len(partes) >= 2:
                return partes[0].zfill(2) + ":" + partes[1].zfill(2)
            return s

        # Busca todos os educandos vinculados (com ou sem turma)
        filhos_rows = execute_query("""
            SELECT h.idMatricula, h.idTurma, h.serie, h.situacao, h.anoLetivo,
                   t.codTurma, t.nomeTurma, t.periodo,
                   er.nomeCompleto
            FROM HistoricoEscolar h
            INNER JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            LEFT JOIN Turmas t ON t.idTurma = h.idTurma
            WHERE h.idResponsavel = %s
            ORDER BY h.anoLetivo DESC, h.idHistorico DESC
        """, (id_responsavel,))

        if not filhos_rows:
            return ok({"filhos": [], "total": 0,
                       "message": "Nenhum educando encontrado para este responsável"})

        # Deduplica por idMatricula (histórico mais recente de cada um)
        seen = set()
        filhos_uniq = []
        for row in filhos_rows:
            mid = row["idMatricula"]
            if mid not in seen:
                seen.add(mid)
                filhos_uniq.append(row)

        resultado = []
        for filho in filhos_uniq:
            id_turma = filho.get("idTurma")

            # Busca horários da turma ([] se sem turma)
            horarios_raw = CronogramaModel.find_by_turma(id_turma) if id_turma else []

            horarios = []
            for h in horarios_raw:
                horarios.append({
                    "id":          h.get("idCronograma") or h.get("id"),
                    "idTurma":     h.get("idTurma"),
                    "idDisciplina": h.get("idDisciplina"),
                    "idEducador":  h.get("idEducador"),
                    "idSala":      h.get("idSala"),
                    "diaSemana":   h.get("diaSemana"),
                    "horaInicio":  _norm_hora(h.get("horaInicio")),
                    "horaFim":     _norm_hora(h.get("horaFim")),
                    "status":      h.get("status"),
                    "observacoes": h.get("observacoes") or "",
                    "turma": {
                        "id":     h.get("idTurma"),
                        "codigo": h.get("codTurma") or "",
                        "nome":   h.get("nomeTurma") or "",
                        "vagas":  h.get("qldVagas"),
                    },
                    "disciplina": {
                        "id":     h.get("idDisciplina"),
                        "codigo": h.get("codDisciplina") or "",
                        "nome":   h.get("nomeDisciplina") or "",
                    },
                    "educador": {
                        "id":       h.get("idEducador"),
                        "matricula": h.get("idEducador"),
                        "nome":     h.get("educadorNome") or "",
                    },
                    "sala": {
                        "id":         h.get("idSala"),
                        "codigo":     h.get("codSala") or "",
                        "nome":       h.get("nomeSala") or "",
                        "capacidade": h.get("salaCapacidade"),
                        "tipo":       h.get("tipoSala") or "",
                    },
                })

            resultado.append({
                "filho": {
                    "idMatricula": filho.get("idMatricula"),
                    "nomeCompleto": filho.get("nomeCompleto"),
                },
                "turma": {
                    "idTurma":   id_turma,
                    "codTurma":  filho.get("codTurma") or "",
                    "nomeTurma": filho.get("nomeTurma") or "",
                    "serie":     filho.get("serie") or "",
                    "periodo":   filho.get("periodo") or "",
                    "anoLetivo": filho.get("anoLetivo") or "",
                },
                "horarios": horarios,
            })

        return ok({"filhos": resultado, "total": len(resultado)})

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


# ── Avaliações ────────────────────────────────────────────────────────────────

@router.route("GET", "/avaliacoes/respondidas")
def avaliacoes_respondidas(event):
    """Lista os formulários já respondidos pelo usuário autenticado."""
    try:
        from app.src.services import avaliacao_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")
        id_usuario = usuario.get("id") or usuario.get("sub", "")
        respondidas = avaliacao_service.listar_respondidas(id_usuario)
        return ok({"respondidas": respondidas})
    except Exception as exc:
        return server_error(str(exc))


@router.route("POST", "/avaliacoes/enviar")
def avaliacoes_enviar(event):
    """Registra o envio de um formulário de avaliação."""
    try:
        from app.src.services import avaliacao_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        body = json.loads(event.get("body") or "{}")
        tipo = body.get("tipo", "").strip()
        respostas = body.get("respostas", {})

        if not tipo:
            return error("Campo 'tipo' é obrigatório")
        if not respostas:
            return error("Campo 'respostas' é obrigatório")

        id_usuario   = usuario.get("id") or usuario.get("sub", "")
        tipo_usuario = usuario.get("perfil") or usuario.get("tipo", "")

        resultado = avaliacao_service.enviar(tipo, id_usuario, tipo_usuario, respostas)
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/dashboard-escolar")
def dashboard_escolar_api(event):
    """
    Retorna estatísticas anônimas e agregadas dos formulários de avaliação
    e dados demográficos de diversidade para exibição no Dashboard Escolar.
    """
    try:
        from app.src.services import avaliacao_service, diversidade_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        dados = avaliacao_service.listar_dashboard()

        try:
            dados["diversidade"] = diversidade_service.listar_diversidade()
        except Exception as exc_div:
            print(f"[dashboard-escolar] diversidade falhou (non-fatal): {exc_div}")
            dados["diversidade"] = {"total": 0, "cor_raca": [], "genero": [], "faixas": []}

        return ok(dados)
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/avaliacoes/participacao/{tipo}")
def avaliacoes_participacao(event):
    """
    Retorna estatísticas ANÔNIMAS de participação por papel (educando/educador/responsavel)
    para um formulário específico. Nunca expõe quem respondeu individualmente.
    """
    try:
        from app.src.services import avaliacao_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")
        tipo = event["pathParameters"]["tipo"]
        resultado = avaliacao_service.listar_participacao(tipo)
        return ok(resultado)
    except Exception as exc:
        return server_error(str(exc))


# ── Formulários Customizados ──────────────────────────────────────────────────

@router.route("POST", "/formularios")
def formularios_criar(event):
    """
    Cria um novo formulário customizado.
    Acesso: gestor, colaborador, administrativo.
    """
    try:
        from app.src.services import formulario_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        perfil = usuario.get("perfil") or usuario.get("tipo", "")
        if perfil not in ("gestor", "colaborador", "administrativo"):
            return error("Sem permissão para criar formulários", 403)

        body = json.loads(event.get("body") or "{}")
        criado_por = usuario.get("id") or usuario.get("sub", "")
        resultado = formulario_service.criar_formulario(body, criado_por=criado_por)
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/formularios")
def formularios_listar(event):
    """
    Retorna formulários customizados visíveis para o tipo de usuário autenticado.
    """
    try:
        from app.src.services import formulario_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        tipo_usuario = usuario.get("perfil") or usuario.get("tipo", "")
        resultado = formulario_service.listar_formularios(tipo_usuario)
        return ok({"formularios": resultado})
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/formularios/{id}")
def formularios_buscar(event):
    """
    Retorna um formulário customizado completo (com perguntas) pelo ID.
    """
    try:
        from app.src.services import formulario_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        form_id = event["pathParameters"]["id"]
        formulario = formulario_service.buscar_por_id(form_id)
        if not formulario:
            return error("Formulário não encontrado", 404)
        return ok(formulario)
    except Exception as exc:
        return server_error(str(exc))


# ── Seed: histórico escolar de educando 445700061 ────────────────────────────

@router.route("POST", "/admin/seed-historico")
def seed_historico(event):
    """
    Insere histórico escolar dos anos 2024 (1º Ano) e 2025 (2º Ano) para o
    educando 445700061. Cria turmas, disciplinas, atividades, notas e frequência.
    """
    try:
        body = json.loads(event.get("body") or "{}")
        if body.get("senha_admin") != "seed_hist_2026":
            return error("Não autorizado", 403)

        from app.src.adapters.db_adapter import execute_query, execute_write
        import random
        random.seed(42)

        ID_MATRICULA = "445700061"
        ID_SALA = 62  # Sala de Aula 001 (já existente)

        # Responsável vinculado ao educando
        resp_rows = execute_query(
            "SELECT idResponsavel FROM HistoricoEscolar WHERE idMatricula = %s LIMIT 1",
            (ID_MATRICULA,)
        )
        id_responsavel = resp_rows[0]["idResponsavel"] if resp_rows else ID_MATRICULA

        # ── 1. Garante disciplinas padrão ────────────────────────────────────
        disciplinas_padrao = [
            ("LP",   "Língua Portuguesa", "Linguagens"),
            ("MAT",  "Matemática",        "Exatas"),
            ("CIEN", "Ciências",          "Ciências Naturais"),
            ("HIST", "História",          "Humanas"),
            ("GEO",  "Geografia",         "Humanas"),
            ("ARTE", "Arte",              "Linguagens"),
            ("EDF",  "Educação Física",   "Linguagens"),
        ]
        disc_ids = {}
        for cod, nome, area in disciplinas_padrao:
            rows = execute_query(
                "SELECT idDisciplina FROM Disciplinas WHERE codDisciplina = %s", (cod,)
            )
            if rows:
                disc_ids[cod] = rows[0]["idDisciplina"]
            else:
                new_id = execute_write(
                    "INSERT INTO Disciplinas (codDisciplina, nomeDisciplina, areaConhecimento) VALUES (%s,%s,%s)",
                    (cod, nome, area)
                )
                disc_ids[cod] = new_id

        # ── 2. Cria ou reutiliza turmas encerradas ────────────────────────────
        anos = [
            {"ano": 2024, "serie": "1º Ano EF", "cod": "1A",
             "nome": "1A - Primeiro Ano A",
             "inicio": "2024-02-01", "fim": "2024-12-15"},
            {"ano": 2025, "serie": "2º Ano EF", "cod": "2A",
             "nome": "2A - Segundo Ano A",
             "inicio": "2025-02-03", "fim": "2025-12-12"},
        ]
        turma_ids = {}
        for t in anos:
            rows = execute_query(
                "SELECT idTurma FROM Turmas WHERE codTurma=%s AND anoLetivo=%s",
                (t["cod"], t["ano"])
            )
            if rows:
                turma_ids[t["ano"]] = rows[0]["idTurma"]
            else:
                new_id = execute_write(
                    """INSERT INTO Turmas
                       (codTurma, nomeTurma, periodo, anoLetivo, serie, qldVagas,
                        dataInicio, dataFim, status, idSala)
                       VALUES (%s,%s,'matutino',%s,%s,35,%s,%s,'encerrada',%s)""",
                    (t["cod"], t["nome"], t["ano"], t["serie"],
                     t["inicio"], t["fim"], ID_SALA)
                )
                turma_ids[t["ano"]] = new_id

        # ── 3. Remove histórico 2024/2025 deste educando e recria ─────────────
        for ano in [2024, 2025]:
            execute_write(
                "DELETE FROM HistoricoEscolar WHERE idMatricula=%s AND anoLetivo=%s",
                (ID_MATRICULA, ano)
            )
        for t in anos:
            execute_write(
                """INSERT INTO HistoricoEscolar
                   (idMatricula, serie, anoLetivo, situacao, idTurma, idResponsavel)
                   VALUES (%s,%s,%s,'aprovado',%s,%s)""",
                (ID_MATRICULA, t["serie"], t["ano"], turma_ids[t["ano"]], id_responsavel)
            )

        # ── 4. Atividades bimestrais (B1-B4) por ano ─────────────────────────
        bimestres = {
            2024: [
                ("B1 2024", "2024-03-28"),
                ("B2 2024", "2024-06-07"),
                ("B3 2024", "2024-09-06"),
                ("B4 2024", "2024-11-29"),
            ],
            2025: [
                ("B1 2025", "2025-03-28"),
                ("B2 2025", "2025-06-06"),
                ("B3 2025", "2025-09-05"),
                ("B4 2025", "2025-11-28"),
            ],
        }

        # ── 5. Remove notas/frequência existentes para estes anos e recria ───
        for ano, id_turma in turma_ids.items():
            execute_write("DELETE FROM Notas WHERE idMatricula=%s AND idTurma=%s",
                          (ID_MATRICULA, id_turma))
            for cod, id_disc in disc_ids.items():
                for b_nome, b_data in bimestres[ano]:
                    # Cria atividade se não existir
                    rows = execute_query(
                        "SELECT idAtividade FROM Atividades WHERE idDisciplina=%s AND atividade=%s",
                        (id_disc, b_nome)
                    )
                    if rows:
                        id_ativ = rows[0]["idAtividade"]
                    else:
                        id_ativ = execute_write(
                            """INSERT INTO Atividades
                               (idDisciplina, atividade, tipoAtividade, dataAtividade, notaMax)
                               VALUES (%s,%s,'Prova',%s,10.0)""",
                            (id_disc, b_nome, b_data)
                        )
                    nota = round(random.uniform(5.5, 10.0), 1)
                    execute_write(
                        """INSERT INTO Notas
                           (idMatricula, idDisciplina, idAtividade, idTurma, notaEducando)
                           VALUES (%s,%s,%s,%s,%s)
                           ON DUPLICATE KEY UPDATE notaEducando=%s""",
                        (ID_MATRICULA, id_disc, id_ativ, id_turma, nota, nota)
                    )

                # Frequência por disciplina × ano (1 registro com prcFreq)
                prc = round(random.uniform(76, 100), 1)
                for b_nome, b_data in bimestres[ano]:
                    execute_write(
                        """INSERT INTO Frequencia (idMatricula, idDisciplina, data, presenca, prcFreq)
                           VALUES (%s,%s,%s,1,%s)
                           ON DUPLICATE KEY UPDATE prcFreq=%s""",
                        (ID_MATRICULA, id_disc, b_data, prc, prc)
                    )

        return ok({
            "mensagem": "Histórico inserido com sucesso",
            "educando": ID_MATRICULA,
            "turmas_criadas": turma_ids,
            "disciplinas": disc_ids,
        })

    except Exception as exc:
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ── Seed de teste: cria responsável + vínculo (REMOVER APÓS USO) ─────────────

@router.route("POST", "/admin/seed-responsavel")
def seed_responsavel(event):
    """
    Cria um usuário responsável de teste e vincula dois educandos de turmas
    diferentes a ele. USAR APENAS UMA VEZ — remover após uso.
    """
    try:
        from app.src.adapters.db_adapter import execute_query, execute_write
        import json as _json

        body = _json.loads(event.get("body") or "{}")
        senha_admin = body.get("senha_admin", "")
        if senha_admin != "seed_resp_2026":
            return unauthorized("Senha de administrador inválida")

        import hashlib as _hashlib

        ID_RESPONSAVEL  = "RESP000001"
        NOME_RESPONSAVEL = "Maria Ferreira"
        EMAIL_RESPONSAVEL = "maria.ferreira@educa.com"
        SENHA_TEXTO     = "Teste@123"
        SENHA_HASH      = _hashlib.sha256(SENHA_TEXTO.encode()).hexdigest()

        # 1. Apaga responsáveis anteriores de teste (ambos os IDs usados)
        for old_id in ("900000001", "RESP000001"):
            execute_write("UPDATE HistoricoEscolar SET idResponsavel = NULL WHERE idResponsavel = %s", (old_id,))
        execute_write("DELETE FROM Login WHERE idMatricula IN ('900000001','RESP000001')", ())
        execute_write("DELETE FROM EducandoResponsavel WHERE idMatricula IN ('900000001','RESP000001')", ())

        # 2. Cria o usuário responsável em EducandoResponsavel
        execute_write("""
            INSERT INTO EducandoResponsavel
              (idMatricula, nomeCompleto, email, tipoUsuario, idStatus)
            VALUES (%s, %s, %s, 'responsavel', 'Ativa')
        """, (ID_RESPONSAVEL, NOME_RESPONSAVEL, EMAIL_RESPONSAVEL))

        # 3. Cria o login com senha SHA-256
        execute_write("""
            INSERT INTO Login (idMatricula, email, senha, senha_definida)
            VALUES (%s, %s, %s, 1)
        """, (ID_RESPONSAVEL, EMAIL_RESPONSAVEL, SENHA_HASH))

        # 3. Busca o idHistorico atual de cada educando
        hist_1a = execute_query("""
            SELECT idHistorico FROM HistoricoEscolar
            WHERE idMatricula = '445700001' AND idTurma IS NOT NULL
            ORDER BY anoLetivo DESC, idHistorico DESC LIMIT 1
        """)
        hist_2a = execute_query("""
            SELECT idHistorico FROM HistoricoEscolar
            WHERE idMatricula = '445700031' AND idTurma IS NOT NULL
            ORDER BY anoLetivo DESC, idHistorico DESC LIMIT 1
        """)

        atualizados = []

        if hist_1a:
            execute_write("""
                UPDATE HistoricoEscolar
                SET idResponsavel = %s
                WHERE idHistorico = %s
            """, (ID_RESPONSAVEL, hist_1a[0]["idHistorico"]))
            atualizados.append("445700001 (Ana Silva 1A)")

        if hist_2a:
            execute_write("""
                UPDATE HistoricoEscolar
                SET idResponsavel = %s
                WHERE idHistorico = %s
            """, (ID_RESPONSAVEL, hist_2a[0]["idHistorico"]))
            atualizados.append("445700031 (Ana Silva 2A)")

        return ok({
            "mensagem": "Responsável criado com sucesso",
            "idResponsavel": ID_RESPONSAVEL,
            "nome": NOME_RESPONSAVEL,
            "email": EMAIL_RESPONSAVEL,
            "senha": SENHA_TEXTO,
            "educandos_vinculados": atualizados
        })

    except Exception as exc:
        import traceback; traceback.print_exc()
        return server_error(str(exc))


# ── Portal do Educando ───────────────────────────────────────────────────────

@router.route("GET", "/portal-educando/{idMatricula}")
def portal_educando(event):
    """Retorna notas e frequência do próprio educando"""
    try:
        from app.src.adapters.db_adapter import execute_query

        id_matricula = event["pathParameters"]["idMatricula"]

        # 1. Turma atual do educando
        turma_rows = execute_query("""
            SELECT h.idMatricula, h.idTurma, h.situacao, h.serie, h.anoLetivo,
                   t.codTurma, t.nomeTurma, t.periodo,
                   er.nomeCompleto
            FROM HistoricoEscolar h
            INNER JOIN Turmas t ON t.idTurma = h.idTurma
            INNER JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idMatricula = %s AND h.idTurma IS NOT NULL
            ORDER BY h.anoLetivo DESC, h.idHistorico DESC
            LIMIT 1
        """, (id_matricula,))

        if not turma_rows:
            # Sem turma — retorna dados mínimos
            nome_rows = execute_query(
                "SELECT nomeCompleto FROM EducandoResponsavel WHERE idMatricula = %s LIMIT 1",
                (id_matricula,)
            )
            nome = nome_rows[0]["nomeCompleto"] if nome_rows else id_matricula
            return ok({"educando": {
                "idMatricula": id_matricula,
                "nome": nome,
                "status": "Ativa",
                "turma": None,
                "disciplinas": []
            }})

        row       = turma_rows[0]
        id_turma  = row["idTurma"]

        # Turno legível
        periodo_raw = (row.get("periodo") or "").lower()
        if "matut" in periodo_raw or periodo_raw == "m":      turno = "Manhã"
        elif periodo_raw in ("v","t") or "tard" in periodo_raw or "vespert" in periodo_raw: turno = "Tarde"
        elif periodo_raw == "n" or "notur" in periodo_raw:   turno = "Noite"
        elif periodo_raw == "i" or "integral" in periodo_raw: turno = "Integral"
        else: turno = row.get("periodo") or ""

        # Situação
        sit = (row.get("situacao") or "").lower()
        if "cursando" in sit or "ativa" in sit: status = "Ativa"
        elif "tranc" in sit:                     status = "Trancada"
        elif "cancel" in sit:                    status = "Cancelada"
        else:                                    status = row.get("situacao") or "Ativa"

        # 2. Disciplinas via Cronograma da turma
        disc_rows = execute_query("""
            SELECT DISTINCT c.idDisciplina, d.nomeDisciplina, d.areaConhecimento
            FROM Cronograma c
            INNER JOIN Disciplinas d ON d.idDisciplina = c.idDisciplina
            WHERE c.idTurma = %s AND c.status != 'cancelada'
            ORDER BY d.nomeDisciplina
        """, (id_turma,))

        disciplinas = []
        for disc in disc_rows:
            id_disc = disc["idDisciplina"]

            # 3. Frequência
            freq_rows = execute_query("""
                SELECT presenca, COUNT(*) as qtd
                FROM Frequencia
                WHERE idMatricula = %s AND idDisciplina = %s
                GROUP BY presenca
            """, (id_matricula, id_disc))

            presentes = ausentes = justificados = 0
            for fr in freq_rows:
                v   = (fr["presenca"] or "").lower()
                qtd = fr["qtd"] or 0
                if v in ("p","presente"):              presentes    += qtd
                elif v in ("a","ausente","falta"):     ausentes     += qtd
                elif v in ("j","justificado"):         justificados += qtd

            total_freq = presentes + ausentes + justificados
            pct = round((presentes + justificados) / total_freq * 100) if total_freq > 0 else 0

            # 4. Atividades + notas
            atividades_rows = execute_query("""
                SELECT a.idAtividade, a.atividade AS nomeAtividade,
                       a.tipoAtividade, a.dataAtividade, a.notaMax,
                       n_edu.notaEducando AS notaAluno
                FROM Atividades a
                LEFT JOIN Notas n_edu
                  ON n_edu.idAtividade = a.idAtividade
                 AND n_edu.idMatricula = %s
                WHERE a.idDisciplina = %s
                ORDER BY a.dataAtividade, a.idAtividade
            """, (id_matricula, id_disc))

            medias_rows = execute_query("""
                SELECT n.idAtividade, AVG(n.notaEducando) AS mediaTurma
                FROM Notas n
                INNER JOIN Atividades a ON a.idAtividade = n.idAtividade
                INNER JOIN HistoricoEscolar h ON h.idMatricula = n.idMatricula
                WHERE a.idDisciplina = %s AND h.idTurma = %s
                GROUP BY n.idAtividade
            """, (id_disc, id_turma))
            medias_map = {r["idAtividade"]: r["mediaTurma"] for r in medias_rows}

            atividades = []
            for at in atividades_rows:
                media_raw = medias_map.get(at["idAtividade"])
                atividades.append({
                    "id":         at["idAtividade"],
                    "nome":       at["nomeAtividade"] or "",
                    "tipo":       at["tipoAtividade"] or "Outro",
                    "data":       str(at["dataAtividade"]) if at["dataAtividade"] else "",
                    "notaMaxima": float(at["notaMax"]) if at["notaMax"] is not None else 10.0,
                    "nota":       float(at["notaAluno"]) if at["notaAluno"] is not None else None,
                    "mediaTurma": float(round(float(media_raw), 1)) if media_raw is not None else None,
                })

            disciplinas.append({
                "idDisciplina": id_disc,
                "nome":  disc["nomeDisciplina"] or "",
                "area":  disc["areaConhecimento"] or "",
                "frequencia": {
                    "total":       total_freq,
                    "presentes":   presentes,
                    "ausentes":    ausentes,
                    "justificados": justificados,
                    "pct":         pct,
                },
                "atividades": atividades,
            })

        return ok({"educando": {
            "idMatricula": id_matricula,
            "nome":        row["nomeCompleto"] or "",
            "status":      status,
            "turma": {
                "idTurma":   id_turma,
                "codigo":    row.get("codTurma") or "",
                "nome":      row.get("nomeTurma") or "",
                "serie":     row.get("serie") or "",
                "turno":     turno,
                "anoLetivo": str(row.get("anoLetivo") or ""),
            },
            "disciplinas": disciplinas,
        }})

    except Exception as exc:
        print(f"[ERROR portal_educando] {exc}")
        import traceback; traceback.print_exc()
        return server_error(str(exc))


# ── Portal do Responsável ─────────────────────────────────────────────────────

@router.route("GET", "/portal-responsavel/{idResponsavel}")
def portal_responsavel(event):
    """Retorna dados completos de todos os educandos de um responsável"""
    try:
        from app.src.adapters.db_adapter import execute_query

        id_responsavel = event["pathParameters"]["idResponsavel"]

        # 1. Busca educandos vinculados ao responsável
        educandos_rows = execute_query("""
            SELECT h.idMatricula, h.idTurma, h.situacao, h.serie, h.anoLetivo,
                   t.codTurma, t.nomeTurma, t.periodo,
                   er.nomeCompleto
            FROM HistoricoEscolar h
            INNER JOIN Turmas t ON t.idTurma = h.idTurma
            INNER JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idResponsavel = %s
              AND h.idTurma IS NOT NULL
            ORDER BY h.anoLetivo DESC, h.idHistorico DESC
        """, (id_responsavel,))

        if not educandos_rows:
            return ok({"educandos": [], "responsavelNome": "", "message": "Nenhum educando encontrado"})

        # Deduplica por idMatricula (pega o histórico mais recente de cada um)
        seen_matriculas = set()
        educandos_uniq = []
        for row in educandos_rows:
            mid = row["idMatricula"]
            if mid not in seen_matriculas:
                seen_matriculas.add(mid)
                educandos_uniq.append(row)

        resultado = []
        for edu in educandos_uniq:
            id_matricula = edu["idMatricula"]
            id_turma = edu["idTurma"]

            # 2. Disciplinas da turma — via Cronograma (fonte confiável)
            disc_rows = execute_query("""
                SELECT DISTINCT c.idDisciplina, d.nomeDisciplina, d.areaConhecimento
                FROM Cronograma c
                INNER JOIN Disciplinas d ON d.idDisciplina = c.idDisciplina
                WHERE c.idTurma = %s AND c.status != 'cancelada'
                ORDER BY d.nomeDisciplina
            """, (id_turma,))

            disciplinas = []
            for disc in disc_rows:
                id_disc = disc["idDisciplina"]

                # 3. Frequência do educando nesta disciplina
                # Valores reais no banco: 'presente', 'ausente', 'justificado' (ou P/A/J)
                freq_rows = execute_query("""
                    SELECT presenca, COUNT(*) as qtd
                    FROM Frequencia
                    WHERE idMatricula = %s AND idDisciplina = %s
                    GROUP BY presenca
                """, (id_matricula, id_disc))

                presentes = ausentes = justificados = 0
                for fr in freq_rows:
                    v = (fr["presenca"] or "").lower()
                    qtd = fr["qtd"] or 0
                    if v in ("p", "presente"):
                        presentes += qtd
                    elif v in ("a", "ausente", "falta"):
                        ausentes += qtd
                    elif v in ("j", "justificado"):
                        justificados += qtd

                total_freq = presentes + ausentes + justificados
                pct = round((presentes + justificados) / total_freq * 100) if total_freq > 0 else 0

                # 4. Atividades da disciplina + nota do educando
                # Atividades NÃO tem idTurma — filtra só por idDisciplina
                atividades_rows = execute_query("""
                    SELECT a.idAtividade, a.atividade AS nomeAtividade,
                           a.tipoAtividade, a.dataAtividade, a.notaMax,
                           n_edu.notaEducando AS notaAluno
                    FROM Atividades a
                    LEFT JOIN Notas n_edu
                      ON n_edu.idAtividade = a.idAtividade
                     AND n_edu.idMatricula = %s
                    WHERE a.idDisciplina = %s
                    ORDER BY a.dataAtividade, a.idAtividade
                """, (id_matricula, id_disc))

                # Média da turma por atividade (educandos da mesma turma)
                medias_rows = execute_query("""
                    SELECT n.idAtividade, AVG(n.notaEducando) AS mediaTurma
                    FROM Notas n
                    INNER JOIN Atividades a ON a.idAtividade = n.idAtividade
                    INNER JOIN HistoricoEscolar h ON h.idMatricula = n.idMatricula
                    WHERE a.idDisciplina = %s AND h.idTurma = %s
                    GROUP BY n.idAtividade
                """, (id_disc, id_turma))
                medias_map = {r["idAtividade"]: r["mediaTurma"] for r in medias_rows}

                atividades = []
                for at in atividades_rows:
                    media_raw = medias_map.get(at["idAtividade"])
                    media_val = float(round(float(media_raw), 1)) if media_raw is not None else None
                    nota_val  = float(at["notaAluno"]) if at["notaAluno"] is not None else None
                    data_str  = str(at["dataAtividade"]) if at["dataAtividade"] else ""

                    atividades.append({
                        "id":          at["idAtividade"],
                        "nome":        at["nomeAtividade"] or "",
                        "tipo":        at["tipoAtividade"] or "Outro",
                        "data":        data_str,
                        "notaMaxima":  float(at["notaMax"]) if at["notaMax"] is not None else 10.0,
                        "nota":        nota_val,
                        "mediaTurma":  media_val,
                    })

                disciplinas.append({
                    "idDisciplina": id_disc,
                    "nome":  disc["nomeDisciplina"] or "",
                    "area":  disc["areaConhecimento"] or "",
                    "frequencia": {
                        "total":       total_freq,
                        "presentes":   presentes,
                        "ausentes":    ausentes,
                        "justificados": justificados,
                        "pct":         pct,
                    },
                    "atividades": atividades,
                })

            # Normaliza situação para maiúscula com primeira letra
            situacao_raw = (edu.get("situacao") or "").lower()
            if "cursando" in situacao_raw or "ativa" in situacao_raw:
                situacao = "Ativa"
            elif "tranc" in situacao_raw:
                situacao = "Trancada"
            elif "cancel" in situacao_raw:
                situacao = "Cancelada"
            else:
                situacao = edu.get("situacao") or "Ativa"

            # Turno legível
            periodo_raw = (edu.get("periodo") or "").lower()
            if "matut" in periodo_raw or periodo_raw == "m":
                turno = "Manhã"
            elif "vespert" in periodo_raw or "tarde" in periodo_raw or periodo_raw in ("v", "t"):
                turno = "Tarde"
            elif "notur" in periodo_raw or "noite" in periodo_raw or periodo_raw == "n":
                turno = "Noite"
            elif "integral" in periodo_raw or periodo_raw == "i":
                turno = "Integral"
            else:
                turno = edu.get("periodo") or ""

            resultado.append({
                "idMatricula": id_matricula,
                "nome":        edu["nomeCompleto"] or "",
                "status":      situacao,
                "turma": {
                    "idTurma":   id_turma,
                    "codigo":    edu.get("codTurma") or "",
                    "nome":      edu.get("nomeTurma") or "",
                    "serie":     edu.get("serie") or "",
                    "turno":     turno,
                    "anoLetivo": str(edu.get("anoLetivo") or ""),
                },
                "disciplinas": disciplinas,
            })

        return ok({"educandos": resultado})

    except Exception as exc:
        print(f"[ERROR portal_responsavel] {exc}")
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


# ── Competências BNCC ────────────────────────────────────────────────────────

@router.route("POST", "/competencias-bncc")
def competencias_bncc_salvar(event):
    """
    Salva (cria ou atualiza) uma avaliação de competências BNCC para um educando.

    Body esperado:
      { idTurma, idDisciplina, idMatricula, bimestre, idEducador, avaliacao }
    """
    try:
        from app.src.services import competencias_bncc_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        body = json.loads(event.get("body") or "{}")
        resultado = competencias_bncc_service.salvar_avaliacao(body)
        return ok(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return server_error(str(exc))


@router.route("GET", "/competencias-bncc/turma")
def competencias_bncc_turma(event):
    """
    Retorna todas as avaliações de uma turma+disciplina+bimestre para estatísticas.
    Query params: idTurma, idDisciplina, bimestre
    """
    try:
        from app.src.services import competencias_bncc_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        qs = event.get("queryStringParameters") or {}
        id_turma      = qs.get("idTurma")
        id_disciplina = qs.get("idDisciplina")
        bimestre      = qs.get("bimestre", "")

        resultado = competencias_bncc_service.listar_avaliacoes_turma(
            int(id_turma) if id_turma else None,
            int(id_disciplina) if id_disciplina else None,
            bimestre,
        )
        return ok({"avaliacoes": resultado})
    except Exception as exc:
        return server_error(str(exc))


@router.route("GET", "/competencias-bncc")
def competencias_bncc_buscar(event):
    """
    Recupera uma avaliação BNCC existente.

    Query params: idTurma, idDisciplina, idMatricula, bimestre
    """
    try:
        from app.src.services import competencias_bncc_service
        usuario = auth_service.get_usuario_do_evento(event)
        if not usuario:
            return unauthorized("Token inválido ou expirado")

        qs = event.get("queryStringParameters") or {}
        id_turma      = qs.get("idTurma")
        id_disciplina = qs.get("idDisciplina")
        id_matricula  = qs.get("idMatricula", "")
        bimestre      = qs.get("bimestre", "")

        resultado = competencias_bncc_service.buscar_avaliacao(
            int(id_turma) if id_turma else None,
            int(id_disciplina) if id_disciplina else None,
            id_matricula,
            bimestre,
        )
        if resultado is None:
            return ok({"avaliacao": None})
        return ok(resultado)
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

