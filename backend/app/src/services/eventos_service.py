"""
Serviço para gerenciamento de eventos escolares
Provas, simulados, reuniões, passeios, feiras, etc
"""

from typing import Dict, List, Optional
from datetime import datetime
from ..models.models import (
    EventoEscolarModel,
    TurmaModel,
    DisciplinaModel,
    EducadorModel,
    SalaModel,
    NotificacaoModel
)


def criar_evento(dados: dict, id_usuario: Optional[int] = None) -> Dict:
    """
    Cria um novo evento escolar
    
    Args:
        dados: {
            'titulo', 'descricao', 'tipoEvento', 'dataInicio', 'dataFim',
            'diaInteiro', 'idTurma', 'idDisciplina', 'idEducador', 'idSala',
            'cor', 'status', 'notificar', 'observacoes'
        }
    """
    try:
        # Validar campos obrigatórios
        if not dados.get("titulo"):
            return {"success": False, "message": "Título é obrigatório"}
        
        if not dados.get("tipoEvento"):
            return {"success": False, "message": "Tipo de evento é obrigatório"}
        
        if not dados.get("dataInicio") or not dados.get("dataFim"):
            return {"success": False, "message": "Data de início e fim são obrigatórias"}
        
        # Validar datas
        try:
            data_inicio = datetime.fromisoformat(dados["dataInicio"].replace('Z', '+00:00'))
            data_fim = datetime.fromisoformat(dados["dataFim"].replace('Z', '+00:00'))
            
            if data_inicio > data_fim:
                return {"success": False, "message": "Data de início deve ser anterior à data de fim"}
        except ValueError:
            return {"success": False, "message": "Formato de data inválido"}
        
        # Criar evento
        id_evento = EventoEscolarModel.create(dados)
        
        # Enviar notificações se solicitado
        if dados.get("notificar", True):
            _enviar_notificacoes_evento(id_evento, dados, id_usuario)
        
        return {
            "success": True,
            "data": {"id": id_evento},
            "message": "Evento criado com sucesso"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao criar evento: {str(e)}"
        }


def atualizar_evento(id_evento: int, dados: dict) -> Dict:
    """Atualiza um evento existente"""
    try:
        EventoEscolarModel.update(id_evento, dados)
        
        return {
            "success": True,
            "data": {"id": id_evento},
            "message": "Evento atualizado com sucesso"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao atualizar evento: {str(e)}"
        }


def deletar_evento(id_evento: int) -> Dict:
    """Remove um evento"""
    try:
        EventoEscolarModel.delete(id_evento)
        
        return {
            "success": True,
            "message": "Evento removido com sucesso"
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao remover evento: {str(e)}"
        }


def listar_eventos(
    tipo_evento: Optional[str] = None,
    status: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None
) -> Dict:
    """
    Lista eventos com filtros opcionais
    """
    try:
        if data_inicio and data_fim:
            eventos = EventoEscolarModel.find_by_periodo(data_inicio, data_fim)
        else:
            eventos = EventoEscolarModel.find_all(tipo_evento, status)
        
        return {
            "success": True,
            "data": eventos,
            "message": f"{len(eventos)} evento(s) encontrado(s)"
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar eventos: {str(e)}"
        }


def listar_eventos_turma(id_turma: int) -> Dict:
    """Lista eventos de uma turma específica"""
    try:
        eventos = EventoEscolarModel.find_by_turma(id_turma)
        
        return {
            "success": True,
            "data": eventos,
            "message": f"{len(eventos)} evento(s) encontrado(s)"
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar eventos: {str(e)}"
        }


def calendario_mensal(ano: int, mes: int, id_turma: Optional[int] = None) -> Dict:
    """
    Retorna todos os eventos e aulas de um mês
    Útil para visualização de calendário
    """
    try:
        from calendar import monthrange
        from ..models.models import CronogramaModel
        
        # Calcular primeiro e último dia do mês
        primeiro_dia = f"{ano}-{mes:02d}-01"
        ultimo_dia_num = monthrange(ano, mes)[1]
        ultimo_dia = f"{ano}-{mes:02d}-{ultimo_dia_num:02d}"
        
        # Buscar eventos
        eventos = EventoEscolarModel.find_by_periodo(
            f"{primeiro_dia} 00:00:00",
            f"{ultimo_dia} 23:59:59"
        )
        
        # Buscar aulas recorrentes
        aulas = []
        if id_turma:
            aulas = CronogramaModel.find_by_turma(id_turma)
        
        return {
            "success": True,
            "data": {
                "eventos": eventos,
                "aulas_recorrentes": aulas,
                "mes": mes,
                "ano": ano
            },
            "message": f"{len(eventos)} evento(s) e {len(aulas)} aula(s) recorrente(s)"
        }
    
    except Exception as e:
        return {
            "success": False,
            "data": {},
            "message": f"Erro ao buscar calendário: {str(e)}"
        }


def _enviar_notificacoes_evento(id_evento: int, dados: dict, id_usuario_criador: Optional[int]) -> None:
    """
    Envia notificações para participantes do evento
    (Esta é uma função auxiliar interna)
    """
    try:
        titulo_notif = f"Novo evento: {dados['titulo']}"
        tipo_notif = "evento_criado"
        
        # Lista de destinatários
        destinatarios = []
        
        # Se for evento de turma, notificar educadores da turma
        if dados.get("idTurma"):
            # Aqui você implementaria a lógica para buscar educadores da turma
            # Por enquanto, apenas exemplo:
            pass
        
        # Se for evento de educador específico, notificar ele
        if dados.get("idEducador"):
            destinatarios.append(dados["idEducador"])
        
        # Criar notificações
        for id_dest in destinatarios:
            if id_dest != id_usuario_criador:  # Não notificar quem criou
                NotificacaoModel.create({
                    "idUsuario": id_dest,
                    "tipo": tipo_notif,
                    "titulo": titulo_notif,
                    "mensagem": f"{dados.get('descricao', 'Sem descrição')}",
                    "link": f"/eventos/{id_evento}",
                    "prioridade": "normal"
                })
    
    except Exception as e:
        print(f"[AVISO] Erro ao enviar notificações: {e}")
        # Não falhar a criação do evento se notificação falhar
