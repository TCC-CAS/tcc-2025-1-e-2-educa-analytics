"""
Serviço para gerenciamento de reposições de aulas
Controla aulas canceladas e suas reposições
"""

from typing import Dict, Optional
from datetime import datetime
from ..models.models import (
    ReposicaoAulaModel,
    CronogramaModel,
    NotificacaoModel
)


def registrar_cancelamento(dados: dict, id_usuario: Optional[int] = None) -> Dict:
    """
    Registra o cancelamento de uma aula
    
    Args:
        dados: {
            'idCronograma': int,
            'dataCancelamento': str,
            'motivoCancelamento': str,
            'observacoes': str (opcional)
        }
    """
    try:
        # Validar campos obrigatórios
        if not dados.get("idCronograma"):
            return {"success": False, "message": "ID da aula original é obrigatório"}
        
        if not dados.get("dataCancelamento"):
            return {"success": False, "message": "Data do cancelamento é obrigatória"}
        
        if not dados.get("motivoCancelamento"):
            return {"success": False, "message": "Motivo do cancelamento é obrigatório"}
        
        # Criar registro de reposição
        id_reposicao = ReposicaoAulaModel.create(dados)
        
        # Atualizar status da aula original para 'cancelada'
        CronogramaModel.update_status(dados["idCronograma"], "cancelada")
        
        # Enviar notificações
        if id_usuario:
            _notificar_cancelamento(dados["idCronograma"], dados["motivoCancelamento"])
        
        return {
            "success": True,
            "data": {"id": id_reposicao},
            "message": "Cancelamento registrado com sucesso. Reposição pendente de agendamento."
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao registrar cancelamento: {str(e)}"
        }


def agendar_reposicao(id_reposicao: int, dados: dict, id_usuario: Optional[int] = None) -> Dict:
    """
    Agenda a data e horário da reposição
    
    Args:
        dados: {
            'dataReposicao': str,
            'horaInicio': str,
            'horaFim': str,
            'idSala': int (opcional)
        }
    """
    try:
        # Validar campos obrigatórios
        if not dados.get("dataReposicao"):
            return {"success": False, "message": "Data da reposição é obrigatória"}
        
        if not dados.get("horaInicio") or not dados.get("horaFim"):
            return {"success": False, "message": "Horários de início e fim são obrigatórios"}
        
        # Buscar informações da aula original
        reposicoes = ReposicaoAulaModel.find_all()
        reposicao = next((r for r in reposicoes if r["idReposicao"] == id_reposicao), None)
        
        if not reposicao:
            return {"success": False, "message": "Reposição não encontrada"}
        
        # Buscar a aula original para obter turma, disciplina, educador
        from ..adapters.db_adapter import execute_query
        aula_original = execute_query(
            "SELECT * FROM cronograma WHERE idCronograma = %s",
            (reposicao["idCronograma"],)
        )
        
        if not aula_original:
            return {"success": False, "message": "Aula original não encontrada"}
        
        aula = aula_original[0]
        
        # Criar nova aula (reposição)
        dados_nova_aula = {
            "idTurma": aula["idTurma"],
            "idDisciplina": aula["idDisciplina"],
            "idEducador": aula["idEducador"],
            "idSala": dados.get("idSala", aula.get("idSala")),
            "diaSemana": _calcular_dia_semana(dados["dataReposicao"]),
            "horaInicio": dados["horaInicio"],
            "horaFim": dados["horaFim"],
            "recorrente": False,  # Reposição não é recorrente
            "dataUnica": dados["dataReposicao"],
            "status": "ativa",
            "observacoes": f"Reposição da aula cancelada em {reposicao['dataCancelamento']}"
        }
        
        # Validar conflitos antes de criar
        from ..services.cronograma_advanced_service import ValidadorCronograma
        valido, erros = ValidadorCronograma.validar_horario_completo(dados_nova_aula)
        
        if not valido:
            return {
                "success": False,
                "message": f"Conflito ao agendar reposição: {'; '.join(erros)}"
            }
        
        # Atualizar registro de reposição (não precisa criar nova aula no cronograma)
        ReposicaoAulaModel.agendar_reposicao(
            id_reposicao=id_reposicao,
            data_reposicao=dados["dataReposicao"],
            hora_inicio=dados["horaInicio"],
            hora_fim=dados["horaFim"],
            id_sala=dados.get("idSala")
        )
        
        # Notificar agendamento
        if id_usuario:
            _notificar_reposicao_agendada(id_reposicao, dados["dataReposicao"])
        
        return {
            "success": True,
            "data": {
                "idReposicao": id_reposicao
            },
            "message": "Reposição agendada com sucesso"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao agendar reposição: {str(e)}"
        }


def listar_reposicoes(status: Optional[str] = None) -> Dict:
    """
    Lista reposições com filtro opcional de status
    
    Status possíveis: 'pendente', 'agendada', 'realizada', 'dispensada'
    """
    try:
        print(f"[DEBUG listar_reposicoes] Chamando ReposicaoAulaModel.find_all(status={status})")
        print(f"[DEBUG listar_reposicoes] ReposicaoAulaModel.TABLE = {ReposicaoAulaModel.TABLE}")
        reposicoes = ReposicaoAulaModel.find_all(status)
        print(f"[DEBUG listar_reposicoes] Sucesso: {len(reposicoes)} reposições")
        
        return {
            "success": True,
            "data": reposicoes,
            "message": f"{len(reposicoes)} reposição(ões) encontrada(s)"
        }
    
    except Exception as e:
        print(f"[DEBUG listar_reposicoes] EXCEÇÃO: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar reposições: {str(e)}"
        }


def listar_reposicoes_pendentes() -> Dict:
    """Lista apenas reposições pendentes de agendamento"""
    try:
        reposicoes = ReposicaoAulaModel.find_pendentes()
        
        return {
            "success": True,
            "data": reposicoes,
            "message": f"{len(reposicoes)} reposição(ões) pendente(s)"
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar reposições pendentes: {str(e)}"
        }


def marcar_reposicao_realizada(id_reposicao: int) -> Dict:
    """Marca uma reposição como realizada"""
    try:
        ReposicaoAulaModel.marcar_realizada(id_reposicao)
        
        return {
            "success": True,
            "message": "Reposição marcada como realizada"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao marcar reposição: {str(e)}"
        }


def sugerir_horarios_reposicao(id_reposicao: int) -> Dict:
    """
    Sugere horários disponíveis para agendar a reposição
    baseado na aula original
    """
    try:
        # Buscar informações da reposição e aula original
        reposicoes = ReposicaoAulaModel.find_all()
        reposicao = next((r for r in reposicoes if r["idReposicao"] == id_reposicao), None)
        
        if not reposicao:
            return {"success": False, "message": "Reposição não encontrada"}
        
        from ..adapters.db_adapter import execute_query
        aula_original = execute_query(
            """
            SELECT c.*, t.qldVagas, t.periodo
            FROM cronograma c
            JOIN turmas t ON c.idTurma = t.idTurma
            WHERE c.idCronograma = %s
            """,
            (reposicao["idCronograma"],)
        )
        
        if not aula_original:
            return {"success": False, "message": "Aula original não encontrada"}
        
        aula = aula_original[0]
        
        # Usar o serviço de sugestão de horários
        from ..services.cronograma_advanced_service import ValidadorCronograma
        
        # Tentar encontrar sala adequada
        salas = SalaModel.find_all_active()
        sala_adequada = next(
            (s for s in salas if s.get("capacidade", 0) >= aula.get("qldVagas", 0)),
            None
        )
        
        id_sala = sala_adequada["idSala"] if sala_adequada else aula.get("idSala")
        
        sugestoes = ValidadorCronograma.sugerir_horarios_livres(
            id_educador=aula["idEducador"],
            id_sala=id_sala,
            id_turma=aula["idTurma"],
            duracao=50
        )
        
        return {
            "success": True,
            "data": sugestoes,
            "message": f"{len(sugestoes)} horário(s) sugerido(s)"
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao sugerir horários: {str(e)}"
        }


# ═══════════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═══════════════════════════════════════════════════════════════════════════

def _calcular_dia_semana(data_str: str) -> str:
    """
    Converte uma data em dia da semana
    
    Args:
        data_str: Data no formato 'YYYY-MM-DD'
    
    Returns:
        Dia da semana: 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
    """
    try:
        data = datetime.strptime(data_str, "%Y-%m-%d")
        dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'segunda']
        return dias[data.weekday()]
    except:
        return 'segunda'  # Fallback


def _notificar_cancelamento(id_cronograma: int, motivo: str) -> None:
    """Envia notificações sobre cancelamento de aula"""
    try:
        from ..adapters.db_adapter import execute_query
        
        # Buscar informações da aula
        aula = execute_query(
            """
            SELECT c.*, t.nomeTurma, d.nomeDisciplina, e.nomeCompleto AS educadorNome
            FROM Cronograma c
            JOIN Turmas t ON c.idTurma = t.idTurma
            JOIN Disciplinas d ON c.idDisciplina = d.idDisciplina
            JOIN Educadores e ON c.idEducador = e.idEducador
            WHERE c.idCronograma = %s
            """,
            (id_cronograma,)
        )
        
        if aula:
            a = aula[0]
            # Aqui você implementaria a lógica para notificar educadores e alunos
            # Por enquanto, apenas log
            print(f"[NOTIFICAÇÃO] Aula cancelada: {a['nomeDisciplina']} - Turma {a['nomeTurma']}")
    
    except Exception as e:
        print(f"[ERRO] Notificação de cancelamento: {e}")


def _notificar_reposicao_agendada(id_reposicao: int, data_reposicao: str) -> None:
    """Envia notificações sobre reposição agendada"""
    try:
        print(f"[NOTIFICAÇÃO] Reposição agendada para {data_reposicao}")
        # Implementar lógica de notificação real aqui
    
    except Exception as e:
        print(f"[ERRO] Notificação de reposição: {e}")
