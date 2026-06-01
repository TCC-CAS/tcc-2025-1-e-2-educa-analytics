"""
Serviço de gerenciamento de atividades avaliativas
"""
from typing import List, Dict, Optional
from datetime import datetime
from ..models.models import (
    AtividadeAvaliacaoModel,
    NotaEducandoModel,
    TurmaModel,
    DisciplinaModel,
    EducadorModel
)


def listar_atividades_turma_disciplina(
    id_turma: int,
    id_disciplina: int
) -> List[Dict]:
    """
    Lista todas as atividades de uma turma/disciplina
    """
    atividades = AtividadeAvaliacaoModel.find_by_turma_disciplina(
        id_turma, id_disciplina
    )
    
    # Para cada atividade, incluir estatísticas de notas
    for atividade in atividades:
        id_atividade = atividade['idAtividade']
        notas = NotaEducandoModel.find_by_atividade(id_atividade)
        
        total_alunos = len(notas)
        avaliados = sum(1 for n in notas if n.get('nota') is not None)
        pendentes = total_alunos - avaliados
        
        notas_validas = [n['nota'] for n in notas if n.get('nota') is not None]
        media = sum(notas_validas) / len(notas_validas) if notas_validas else None
        
        atividade['estatisticas'] = {
            'totalAlunos': total_alunos,
            'avaliados': avaliados,
            'pendentes': pendentes,
            'mediaTurma': round(media, 2) if media else None
        }
    
    return atividades


def buscar_atividade(id_atividade: int) -> Optional[Dict]:
    """
    Busca uma atividade por ID
    """
    atividade = AtividadeAvaliacaoModel.find_by_id(id_atividade)
    
    if atividade:
        # Incluir notas
        notas = NotaEducandoModel.find_by_atividade(id_atividade)
        atividade['notas'] = notas
    
    return atividade


def criar_atividade(data: Dict) -> Dict:
    """
    Cria uma nova atividade avaliativa
    
    Args:
        data: {
            idTurma, idDisciplina, idEducador, nome, tipo,
            dataAtividade, notaMaxima, peso, descricao, observacoes
        }
    """
    # Validações
    if not data.get('nome'):
        return {'success': False, 'message': 'Nome da atividade é obrigatório'}
    
    if not data.get('tipo'):
        return {'success': False, 'message': 'Tipo da atividade é obrigatório'}
    
    tipos_validos = ['Prova', 'Trabalho', 'Apresentação', 'Seminário', 'Exercício', 'Projeto']
    if data['tipo'] not in tipos_validos:
        return {'success': False, 'message': f'Tipo inválido. Use: {", ".join(tipos_validos)}'}
    
    if not data.get('dataAtividade'):
        return {'success': False, 'message': 'Data da atividade é obrigatória'}
    
    # Garantir valores padrão
    data.setdefault('notaMaxima', 10.00)
    data.setdefault('peso', 1.00)
    data.setdefault('status', 'planejada')
    
    try:
        id_atividade = AtividadeAvaliacaoModel.create(data)
        
        # Criar registros de notas pendentes para todos educandos da turma
        from .frequencia_service import obter_educandos_turma
        educandos = obter_educandos_turma(data['idTurma'])
        
        for educando in educandos:
            NotaEducandoModel.create_or_update({
                'idAtividade': id_atividade,
                'idMatricula': educando['idMatricula'],
                'idEducador': data['idEducador'],
                'nota': None,
                'status': 'pendente'
            })
        
        return {
            'success': True,
            'message': 'Atividade criada com sucesso',
            'idAtividade': id_atividade
        }
    except Exception as e:
        return {'success': False, 'message': f'Erro ao criar atividade: {str(e)}'}


def atualizar_atividade(id_atividade: int, data: Dict) -> Dict:
    """
    Atualiza uma atividade existente
    """
    # Verificar se existe
    atividade = AtividadeAvaliacaoModel.find_by_id(id_atividade)
    if not atividade:
        return {'success': False, 'message': 'Atividade não encontrada'}
    
    # Validações
    if data.get('tipo'):
        tipos_validos = ['Prova', 'Trabalho', 'Apresentação', 'Seminário', 'Exercício', 'Projeto']
        if data['tipo'] not in tipos_validos:
            return {'success': False, 'message': f'Tipo inválido'}
    
    try:
        AtividadeAvaliacaoModel.update(id_atividade, data)
        return {'success': True, 'message': 'Atividade atualizada com sucesso'}
    except Exception as e:
        return {'success': False, 'message': f'Erro ao atualizar: {str(e)}'}


def excluir_atividade(id_atividade: int) -> Dict:
    """
    Marca atividade como cancelada (soft delete)
    """
    atividade = AtividadeAvaliacaoModel.find_by_id(id_atividade)
    if not atividade:
        return {'success': False, 'message': 'Atividade não encontrada'}
    
    try:
        AtividadeAvaliacaoModel.delete(id_atividade)
        return {'success': True, 'message': 'Atividade cancelada com sucesso'}
    except Exception as e:
        return {'success': False, 'message': f'Erro ao cancelar: {str(e)}'}


def alterar_status_atividade(id_atividade: int, novo_status: str) -> Dict:
    """
    Altera o status de uma atividade
    """
    status_validos = ['planejada', 'em_andamento', 'concluida', 'cancelada']
    if novo_status not in status_validos:
        return {'success': False, 'message': f'Status inválido. Use: {", ".join(status_validos)}'}
    
    try:
        AtividadeAvaliacaoModel.update(id_atividade, {'status': novo_status})
        return {'success': True, 'message': f'Status atualizado para: {novo_status}'}
    except Exception as e:
        return {'success': False, 'message': f'Erro ao atualizar status: {str(e)}'}
