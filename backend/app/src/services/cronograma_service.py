"""
Serviço de Cronograma para gerenciamento de horários de aulas
"""

from ..models.models import CronogramaModel, TurmaModel, SalaModel


def listar_cronograma_turma(id_turma: int) -> dict:
    """
    Lista todos os horários de uma turma
    
    Args:
        id_turma: ID da turma
    
    Returns:
        Dict com success, data e message
    """
    try:
        horarios = CronogramaModel.find_by_turma(id_turma)
        
        # Normalizar campos para o frontend
        horarios_normalizados = []
        for h in horarios:
            # Parse recursos da sala (JSON)
            recursos = {}
            if h.get("salaRecursos"):
                import json
                try:
                    recursos = json.loads(h["salaRecursos"])
                except (json.JSONDecodeError, TypeError):
                    recursos = {}
            
            horarios_normalizados.append({
                "id": h["idCronograma"],
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
                "diaSemana": h["diaSemana"],
                "horaInicio": str(h["horaInicio"]),
                "horaFim": str(h["horaFim"]),
                "observacoes": h.get("observacoes", "")
            })
        
        return {
            "success": True,
            "data": horarios_normalizados,
            "message": f"{len(horarios_normalizados)} horário(s) encontrado(s)"
        }
    
    except Exception as e:
        print(f"[ERROR listar_cronograma_turma] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar cronograma: {str(e)}"
        }


def criar_aula(body: dict) -> dict:
    """
    Cria um novo horário no cronograma com validações
    
    Args:
        body: Dados da aula (idTurma, idDisciplina, idEducador, idSala, diaSemana, horaInicio, horaFim)
    
    Returns:
        Dict com success, data e message
    """
    try:
        # Validar campos obrigatórios
        campos_obrigatorios = ["idTurma", "idDisciplina", "idEducador", "diaSemana", "horaInicio", "horaFim"]
        erros = []
        
        for campo in campos_obrigatorios:
            if campo not in body or body[campo] is None:
                erros.append(f"Campo '{campo}' é obrigatório")
        
        if erros:
            return {
                "success": False,
                "data": None,
                "message": "; ".join(erros)
            }
        
        # Validar se sala foi fornecida
        id_sala = body.get("idSala")
        if not id_sala:
            return {
                "success": False,
                "data": None,
                "message": "Sala é obrigatória"
            }
        
        # Validar conflito de sala
        conflitos_sala = CronogramaModel.find_conflitos_sala(
            id_sala=id_sala,
            dia_semana=body["diaSemana"],
            hora_inicio=body["horaInicio"],
            hora_fim=body["horaFim"]
        )
        
        if conflitos_sala:
            turma_conflito = conflitos_sala[0]
            return {
                "success": False,
                "data": None,
                "message": f"Sala já está ocupada pela turma {turma_conflito['codTurma']} ({turma_conflito['nomeTurma']}) neste horário"
            }
        
        # Validar conflito de educador
        conflitos_educador = CronogramaModel.find_conflitos_educador(
            id_educador=body["idEducador"],
            dia_semana=body["diaSemana"],
            hora_inicio=body["horaInicio"],
            hora_fim=body["horaFim"]
        )
        
        if conflitos_educador:
            turma_conflito = conflitos_educador[0]
            return {
                "success": False,
                "data": None,
                "message": f"Educador já está lecionando para a turma {turma_conflito['codTurma']} neste horário"
            }
        
        # Validar capacidade da sala vs vagas da turma
        sala = SalaModel.find_by_id(id_sala)
        turma = TurmaModel.find_by_id(body["idTurma"])
        
        if sala and turma:
            capacidade_sala = sala.get("capacidade", 0)
            vagas_turma = turma.get("qldVagas", 0)
            
            if capacidade_sala < vagas_turma:
                return {
                    "success": False,
                    "data": None,
                    "message": f"Sala {sala['nomeSala']} tem capacidade de {capacidade_sala} alunos, mas a turma tem {vagas_turma} vagas"
                }
        
        # Criar horário
        id_cronograma = CronogramaModel.create(body)
        
        # Buscar horário criado com informações completas
        horarios = CronogramaModel.find_by_turma(body["idTurma"])
        horario_criado = next((h for h in horarios if h["idCronograma"] == id_cronograma), None)
        
        if not horario_criado:
            return {
                "success": True,
                "data": {"id": id_cronograma},
                "message": "Horário criado com sucesso"
            }
        
        # Normalizar resposta (mesmo formato de listar_cronograma_turma)
        import json
        recursos = {}
        if horario_criado.get("salaRecursos"):
            try:
                recursos = json.loads(horario_criado["salaRecursos"])
            except (json.JSONDecodeError, TypeError):
                recursos = {}
        
        horario_normalizado = {
            "id": horario_criado["idCronograma"],
            "turma": {
                "id": horario_criado["idTurma"],
                "codigo": horario_criado.get("codTurma"),
                "nome": horario_criado.get("nomeTurma"),
                "vagas": horario_criado.get("qldVagas")
            },
            "disciplina": {
                "id": horario_criado["idDisciplina"],
                "codigo": horario_criado.get("codDisciplina"),
                "nome": horario_criado.get("nomeDisciplina"),
                "cargaHoraria": horario_criado.get("cargaHoraria")
            },
            "educador": {
                "id": horario_criado["idEducador"],
                "matricula": horario_criado.get("educadorMatricula"),
                "nome": horario_criado.get("educadorNome")
            },
            "sala": {
                "id": horario_criado.get("idSala"),
                "codigo": horario_criado.get("codSala"),
                "nome": horario_criado.get("nomeSala"),
                "capacidade": horario_criado.get("salaCapacidade"),
                "tipo": horario_criado.get("tipoSala"),
                "recursos": recursos
            } if horario_criado.get("idSala") else None,
            "diaSemana": horario_criado["diaSemana"],
            "horaInicio": str(horario_criado["horaInicio"]),
            "horaFim": str(horario_criado["horaFim"]),
            "observacoes": horario_criado.get("observacoes", "")
        }
        
        return {
            "success": True,
            "data": horario_normalizado,
            "message": "Horário criado com sucesso"
        }
    
    except Exception as e:
        print(f"[ERROR criar_aula] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": None,
            "message": f"Erro ao criar horário: {str(e)}"
        }


def atualizar_aula(id_cronograma: int, body: dict) -> dict:
    """
    Atualiza um horário existente no cronograma
    
    Args:
        id_cronograma: ID do horário
        body: Dados atualizados
    
    Returns:
        Dict com success, data e message
    """
    try:
        # Validar se sala foi fornecida
        id_sala = body.get("idSala")
        if id_sala:
            # Validar conflito de sala (excluindo o horário atual)
            conflitos_sala = CronogramaModel.find_conflitos_sala(
                id_sala=id_sala,
                dia_semana=body["diaSemana"],
                hora_inicio=body["horaInicio"],
                hora_fim=body["horaFim"],
                exclude_id=id_cronograma
            )
            
            if conflitos_sala:
                turma_conflito = conflitos_sala[0]
                return {
                    "success": False,
                    "data": None,
                    "message": f"Sala já está ocupada pela turma {turma_conflito['codTurma']} neste horário"
                }
        
        # Validar conflito de educador (excluindo o horário atual)
        conflitos_educador = CronogramaModel.find_conflitos_educador(
            id_educador=body["idEducador"],
            dia_semana=body["diaSemana"],
            hora_inicio=body["horaInicio"],
            hora_fim=body["horaFim"],
            exclude_id=id_cronograma
        )
        
        if conflitos_educador:
            turma_conflito = conflitos_educador[0]
            return {
                "success": False,
                "data": None,
                "message": f"Educador já está lecionando para a turma {turma_conflito['codTurma']} neste horário"
            }
        
        # Atualizar horário
        CronogramaModel.update(id_cronograma, body)
        
        return {
            "success": True,
            "data": {"id": id_cronograma},
            "message": "Horário atualizado com sucesso"
        }
    
    except Exception as e:
        print(f"[ERROR atualizar_aula] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": None,
            "message": f"Erro ao atualizar horário: {str(e)}"
        }


def deletar_aula(id_cronograma: int) -> dict:
    """
    Remove um horário do cronograma
    
    Args:
        id_cronograma: ID do horário
    
    Returns:
        Dict com success e message
    """
    try:
        CronogramaModel.delete(id_cronograma)
        
        return {
            "success": True,
            "message": "Horário removido com sucesso"
        }
    
    except Exception as e:
        print(f"[ERROR deletar_aula] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao remover horário: {str(e)}"
        }
