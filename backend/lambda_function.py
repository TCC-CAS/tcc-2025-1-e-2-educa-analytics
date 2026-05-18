import json
import os
from dotenv import load_dotenv

# Carrega o .env somente em desenvolvimento local (na Lambda as variáveis já
# estão definidas em Environment variables e load_dotenv não as sobrescreve)
load_dotenv(override=True)

from app.src.utils.router import Router
from app.src.utils.response import ok, created, error, not_found, unauthorized, server_error
from app.src.services import (
    auth_service,
    alunos_service,
    matricula_service,
    colaborador_service,
    educador_service,
    turmas_service,
    salas_service,
    disciplinas_service,
    educadores_service,
    cronograma_service
)
from app.src.models.models import DisciplinaModel, SalaModel

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
    senha = body.get("senha", "") or body.get("password", "")
    captcha_token = body.get("captchaToken", "")
    
    if not email or not senha:
        return error("email e senha são obrigatórios")
    
    # Validar reCAPTCHA
    if not auth_service.validar_recaptcha(captcha_token):
        return error("Falha na validação do reCAPTCHA. Por favor, tente novamente.")
    
    resultado = auth_service.login(email, senha)
    if not resultado:
        return unauthorized("Credenciais inválidas")
    return ok(resultado)


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


# ── Disciplinas ───────────────────────────────────────────────────────────────

@router.route("GET", "/disciplinas")
def listar_disciplinas_route(event):
    """Lista todas as disciplinas"""
    try:
        query_params = event.get("queryStringParameters") or {}
        status = query_params.get("status")  # pode ser 'ativa', 'inativa' ou None (todas)
        
        resultado = disciplinas_service.listar_disciplinas(status=status)
        
        if resultado["success"]:
            return ok(resultado["data"])
        else:
            return error(resultado["message"], 400)
    
    except Exception as exc:
        print(f"[ERROR listar_disciplinas_route] {exc}")
        import traceback
        traceback.print_exc()
        return error(f"Erro ao listar disciplinas: {str(exc)}", 500)


@router.route("GET", "/disciplinas/{id}")
def buscar_disciplina_route(event):
    """Busca uma disciplina específica por ID"""
    try:
        id_disciplina = int(event["pathParameters"]["id"])
        resultado = disciplinas_service.buscar_disciplina(id_disciplina)
        
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
        body = event.get("body", {})
        resultado = disciplinas_service.criar_disciplina(body)
        
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
        id_disciplina = int(event["pathParameters"]["id"])
        body = event.get("body", {})
        resultado = disciplinas_service.atualizar_disciplina(id_disciplina, body)
        
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
        id_disciplina = int(event["pathParameters"]["id"])
        query_params = event.get("queryStringParameters") or {}
        permanente = query_params.get("permanente", "false").lower() == "true"
        
        resultado = disciplinas_service.deletar_disciplina(id_disciplina, permanente)
        
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


# ── Turmas ────────────────────────────────────────────────────────────────────

@router.route("GET", "/turmas")
def listar_turmas_route(_event):
    try:
        return ok(turmas_service.listar_turmas())
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("POST", "/turmas")
def criar_turma_route(event):
    try:
        resultado = turmas_service.criar_turma(event.get("body") or "{}")
        return created(resultado)
    except ValueError as exc:
        return error(str(exc))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


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


@router.route("GET", "/turmas/{idTurma}/educandos")
def listar_educandos_turma(event):
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
        return ok(turmas_service.listar_educandos_turma(id_turma))
    except Exception as exc:
        args = getattr(exc, "args", ())
        msg = args[1] if len(args) >= 2 else str(exc)
        return server_error(msg)


@router.route("GET", "/turmas/{idTurma}")
def buscar_turma_route(event):
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
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
    try:
        id_turma = int(event["pathParameters"]["idTurma"])
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


# ── Anos Letivos ──────────────────────────────────────────────────────────────

@router.route("GET", "/anos-letivos")
def listar_anos_letivos_route(_event):
    """Lista todos os anos letivos disponíveis"""
    try:
        anos = turmas_service.listar_anos_letivos()
        return ok(anos)
    except Exception as exc:
        return server_error(str(exc))


# ── Disciplinas (Cronograma) ──────────────────────────────────────────────────

@router.route("GET", "/cronograma/disciplinas")
def listar_disciplinas_cronograma(event):
    """Lista disciplinas ativas para seleção no cronograma"""
    try:
        query_params = event.get("queryStringParameters") or {}
        status = query_params.get("status", "ativa")
        resultado = disciplinas_service.listar_disciplinas(status=status)
        
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


# ── Entry-point Lambda ────────────────────────────────────────────────────────

def lambda_handler(event, context):
    return router.dispatch(event)


# Debug: Print registered routes
if __name__ == "__main__":
    print("\n=== Rotas Registradas ===")
    for method, path, handler in router._routes:
        print(f"{method:6} {path:40} -> {handler.__name__}")
    print("=" * 60)

