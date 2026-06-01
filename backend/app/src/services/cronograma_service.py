"""
Serviço de Cronograma para gerenciamento de horários de aulas.
"""

import json
from ..models.models import CronogramaModel, TurmaModel, SalaModel


def _normalizar_horario(h: dict) -> dict:
    """
    Converte um registro bruto do banco para o formato esperado pelo frontend.

    O frontend lê tanto os campos planos (idTurma, idDisciplina, idEducador, idSala)
    quanto os objetos aninhados (disciplina.nome, educador.nome, sala.nome).
    """
    recursos = {}
    if h.get("salaRecursos"):
        try:
            recursos = json.loads(h["salaRecursos"])
        except (json.JSONDecodeError, TypeError):
            recursos = {}

    hora_inicio = h.get("horaInicio")
    hora_fim = h.get("horaFim")

    return {
        # Identificador principal
        "id": h["idCronograma"],

        # IDs planos — lidos diretamente pelo componente Angular
        "idTurma": h["idTurma"],
        "idDisciplina": h["idDisciplina"],
        "idEducador": h["idEducador"],
        "idSala": h.get("idSala"),

        # Objetos expandidos — usados para exibir nomes
        "turma": {
            "id": h["idTurma"],
            "codigo": h.get("codTurma"),
            "nome": h.get("nomeTurma"),
            "vagas": h.get("qldVagas")
        },
        "disciplina": {
            "id": h["idDisciplina"],
            "codigo": h.get("codDisciplina"),
            "nome": h.get("nomeDisciplina"),
            "cargaHoraria": h.get("cargaHoraria")
        },
        "educador": {
            "id": h["idEducador"],
            "matricula": h.get("educadorMatricula"),
            "nome": h.get("educadorNome")
        },
        "sala": {
            "id": h.get("idSala"),
            "codigo": h.get("codSala"),
            "nome": h.get("nomeSala"),
            "capacidade": h.get("salaCapacidade"),
            "tipo": h.get("tipoSala"),
            "recursos": recursos
        } if h.get("idSala") else None,

        # Horário
        "diaSemana": h["diaSemana"],
        "horaInicio": str(hora_inicio) if hora_inicio is not None else "",
        "horaFim": str(hora_fim) if hora_fim is not None else "",
        "status": h.get("status", "ativa"),
        "observacoes": h.get("observacoes") or ""
    }


def listar_cronograma_turma(id_turma: int) -> dict:
    """Lista todos os horários de uma turma com informações completas."""
    try:
        horarios = CronogramaModel.find_by_turma(id_turma)
        data = [_normalizar_horario(h) for h in horarios]

        return {
            "success": True,
            "data": data,
            "message": f"{len(data)} horário(s) encontrado(s)"
        }

    except Exception as e:
        print(f"[ERROR listar_cronograma_turma] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "data": [], "message": f"Erro ao listar cronograma: {str(e)}"}


def criar_aula(body: dict) -> dict:
    """
    Cria um novo horário no cronograma com validações de conflito.

    Campos obrigatórios: idTurma, idDisciplina, idEducador, diaSemana, horaInicio, horaFim.
    idSala é recomendado mas não obrigatório (aulas podem ocorrer em local externo).
    """
    try:
        # Validar campos obrigatórios
        obrigatorios = ["idTurma", "idDisciplina", "idEducador", "diaSemana", "horaInicio", "horaFim"]
        faltando = [c for c in obrigatorios if not body.get(c)]
        if faltando:
            return {
                "success": False,
                "data": None,
                "message": f"Campos obrigatórios ausentes: {', '.join(faltando)}"
            }

        id_sala = body.get("idSala")

        # Validar conflito de sala (somente se sala informada)
        if id_sala:
            conflitos_sala = CronogramaModel.find_conflitos_sala(
                id_sala=int(id_sala),
                dia_semana=body["diaSemana"],
                hora_inicio=body["horaInicio"],
                hora_fim=body["horaFim"]
            )
            if conflitos_sala:
                c = conflitos_sala[0]
                return {
                    "success": False,
                    "data": None,
                    "message": f"Sala já ocupada pela turma {c.get('codTurma', c.get('nomeTurma', ''))} neste horário"
                }

            # Validar capacidade da sala vs vagas da turma
            sala = SalaModel.find_by_id(int(id_sala))
            turma = TurmaModel.find_by_id(int(body["idTurma"]))
            if sala and turma:
                cap = sala.get("capacidade", 0) or 0
                vagas = turma.get("qldVagas") or turma.get("capacidade_maxima") or 0
                if cap and vagas and cap < vagas:
                    return {
                        "success": False,
                        "data": None,
                        "message": (
                            f"Sala {sala['nomeSala']} tem capacidade {cap}, "
                            f"mas a turma tem {vagas} vagas"
                        )
                    }

        # Validar conflito de educador
        conflitos_edu = CronogramaModel.find_conflitos_educador(
            id_educador=body["idEducador"],
            dia_semana=body["diaSemana"],
            hora_inicio=body["horaInicio"],
            hora_fim=body["horaFim"]
        )
        if conflitos_edu:
            c = conflitos_edu[0]
            return {
                "success": False,
                "data": None,
                "message": f"Educador já está lecionando para a turma {c.get('codTurma', c.get('nomeTurma', ''))} neste horário"
            }

        try:
            id_cronograma = CronogramaModel.create(body)
        except Exception as db_err:
            err_str = str(db_err)
            # Captura violação de chave única (Duplicate entry) como fallback
            if '1062' in err_str or 'Duplicate' in err_str or 'duplicate' in err_str:
                return {
                    "success": False,
                    "data": None,
                    "message": "Conflito detectado: este educador já possui uma aula neste horário."
                }
            raise

        # Retornar o horário recém-criado com informações completas
        horarios = CronogramaModel.find_by_turma(int(body["idTurma"]))
        criado = next((h for h in horarios if h["idCronograma"] == id_cronograma), None)

        if criado:
            return {"success": True, "data": _normalizar_horario(criado), "message": "Horário criado com sucesso"}

        return {"success": True, "data": {"id": id_cronograma}, "message": "Horário criado com sucesso"}

    except Exception as e:
        print(f"[ERROR criar_aula] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "data": None, "message": f"Erro ao criar horário: {str(e)}"}


def atualizar_aula(id_cronograma: int, body: dict) -> dict:
    """Atualiza um horário existente, re-validando conflitos (excluindo o próprio)."""
    try:
        id_sala = body.get("idSala")

        if id_sala:
            conflitos_sala = CronogramaModel.find_conflitos_sala(
                id_sala=int(id_sala),
                dia_semana=body["diaSemana"],
                hora_inicio=body["horaInicio"],
                hora_fim=body["horaFim"],
                exclude_id=id_cronograma
            )
            if conflitos_sala:
                c = conflitos_sala[0]
                return {
                    "success": False,
                    "data": None,
                    "message": f"Sala já ocupada pela turma {c.get('codTurma', c.get('nomeTurma', ''))} neste horário"
                }

        if body.get("idEducador"):
            conflitos_edu = CronogramaModel.find_conflitos_educador(
                id_educador=body["idEducador"],
                dia_semana=body["diaSemana"],
                hora_inicio=body["horaInicio"],
                hora_fim=body["horaFim"],
                exclude_id=id_cronograma
            )
            if conflitos_edu:
                c = conflitos_edu[0]
                return {
                    "success": False,
                    "data": None,
                    "message": f"Educador já está lecionando para a turma {c.get('codTurma', c.get('nomeTurma', ''))} neste horário"
                }

        CronogramaModel.update(id_cronograma, body)

        return {"success": True, "data": {"id": id_cronograma}, "message": "Horário atualizado com sucesso"}

    except Exception as e:
        print(f"[ERROR atualizar_aula] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "data": None, "message": f"Erro ao atualizar horário: {str(e)}"}


def deletar_aula(id_cronograma: int) -> dict:
    """Remove um horário do cronograma."""
    try:
        CronogramaModel.delete(id_cronograma)
        return {"success": True, "message": "Horário removido com sucesso"}

    except Exception as e:
        print(f"[ERROR deletar_aula] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "message": f"Erro ao remover horário: {str(e)}"}
