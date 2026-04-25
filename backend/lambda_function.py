import json
import os
from dotenv import load_dotenv

# Carrega o .env somente em desenvolvimento local (na Lambda as variáveis já
# estão definidas em Environment variables e load_dotenv não as sobrescreve)
load_dotenv(override=True)

from app.src.utils.router import Router
from app.src.utils.response import ok, created, error, not_found, unauthorized, server_error
from app.src.services import auth_service, alunos_service, matricula_service

router = Router()


# ── Healthcheck ───────────────────────────────────────────────────────────────

@router.route("GET", "/")
def healthcheck(_event):
    return ok({"message": "educaAnalytics API online", "status": "ok"})


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.route("POST", "/auth/login")
def login(event):
    body = json.loads(event.get("body") or "{}")
    email = body.get("email", "")
    senha = body.get("senha", "")
    if not email or not senha:
        return error("email e senha são obrigatórios")
    resultado = auth_service.login(email, senha)
    if not resultado:
        return unauthorized("Credenciais inválidas")
    return ok(resultado)


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


# ── Alunos (legado) ───────────────────────────────────────────────────────────

@router.route("GET", "/alunos")
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


# ── Entry-point Lambda ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    return router.dispatch(event)

