"""
Serviço de gerenciamento de notas dos educandos
"""
from typing import List, Dict, Optional
from ..models.models import (
    NotaEducandoModel,
    AtividadeAvaliacaoModel,
    EducandoResponsavelModel
)


def lancar_notas_atividade(
    id_atividade: int,
    id_educador: int,
    notas: List[Dict]
) -> Dict:
    """
    Lança/atualiza notas de múltiplos educandos em uma atividade
    
    Args:
        id_atividade: ID da atividade
        id_educador: ID do educador que está lançando
        notas: Lista de {idMatricula, nota, observacao}
    """
    # Verificar se a atividade existe
    atividade = AtividadeAvaliacaoModel.find_by_id(id_atividade)
    if not atividade:
        return {'success': False, 'message': 'Atividade não encontrada'}
    
    nota_maxima = float(atividade['notaMaxima'])
    
    # Validar notas
    for nota_data in notas:
        nota = nota_data.get('nota')
        if nota is not None:
            try:
                nota_float = float(nota)
                if nota_float < 0 or nota_float > nota_maxima:
                    return {
                        'success': False,
                        'message': f'Nota deve estar entre 0 e {nota_maxima}'
                    }
            except (ValueError, TypeError):
                return {'success': False, 'message': 'Nota inválida'}
    
    # Preparar registros
    registros = []
    for nota_data in notas:
        registros.append({
            'idAtividade': id_atividade,
            'idMatricula': nota_data['idMatricula'],
            'idEducador': id_educador,
            'nota': nota_data.get('nota'),
            'observacao': nota_data.get('observacao'),
            'status': 'avaliado' if nota_data.get('nota') is not None else 'pendente'
        })
    
    try:
        count = NotaEducandoModel.salvar_lote(registros)
        return {
            'success': True,
            'message': f'Notas salvas para {count} educando(s)',
            'count': count
        }
    except Exception as e:
        return {'success': False, 'message': f'Erro ao salvar notas: {str(e)}'}


def buscar_notas_atividade(id_atividade: int) -> Dict:
    """
    Busca todas as notas de uma atividade
    """
    atividade = AtividadeAvaliacaoModel.find_by_id(id_atividade)
    if not atividade:
        return {'success': False, 'message': 'Atividade não encontrada'}
    
    notas = NotaEducandoModel.find_by_atividade(id_atividade)
    
    return {
        'success': True,
        'atividade': {
            'idAtividade': id_atividade,
            'nome': atividade['nome'],
            'tipo': atividade['tipo'],
            'notaMaxima': float(atividade['notaMaxima']),
            'dataAtividade': atividade['dataAtividade'].strftime('%Y-%m-%d') if hasattr(atividade['dataAtividade'], 'strftime') else str(atividade['dataAtividade'])
        },
        'notas': notas
    }


def buscar_notas_educando(
    id_matricula: int,
    id_turma: int,
    id_disciplina: int
) -> Dict:
    """
    Busca todas as notas de um educando em uma disciplina
    """
    educando = EducandoResponsavelModel.find_by_id(id_matricula)
    if not educando:
        return {'success': False, 'message': 'Educando não encontrado'}
    
    notas = NotaEducandoModel.find_by_educando_turma_disciplina(
        id_matricula, id_turma, id_disciplina
    )
    
    # Calcular média
    media_info = NotaEducandoModel.calcular_media_educando(
        id_matricula, id_turma, id_disciplina
    )
    
    return {
        'success': True,
        'educando': {
            'idMatricula': id_matricula,
            'nomeCompleto': educando['nomeCompleto']
        },
        'notas': notas,
        'media': media_info
    }


def calcular_media_turma(id_turma: int, id_disciplina: int) -> Dict:
    """
    Calcula médias de todos educandos da turma
    """
    relatorio = NotaEducandoModel.relatorio_turma(id_turma, id_disciplina)
    
    return {
        'success': True,
        'idTurma': id_turma,
        'idDisciplina': id_disciplina,
        'educandos': relatorio
    }


def atualizar_nota_individual(
    id_atividade: int,
    id_matricula: int,
    id_educador: int,
    nota: Optional[float],
    observacao: Optional[str] = None
) -> Dict:
    """
    Atualiza nota de um educando específico
    """
    # Verificar se a atividade existe
    atividade = AtividadeAvaliacaoModel.find_by_id(id_atividade)
    if not atividade:
        return {'success': False, 'message': 'Atividade não encontrada'}
    
    # Validar nota
    if nota is not None:
        nota_maxima = float(atividade['notaMaxima'])
        if nota < 0 or nota > nota_maxima:
            return {
                'success': False,
                'message': f'Nota deve estar entre 0 e {nota_maxima}'
            }
    
    try:
        NotaEducandoModel.create_or_update({
            'idAtividade': id_atividade,
            'idMatricula': id_matricula,
            'idEducador': id_educador,
            'nota': nota,
            'observacao': observacao,
            'status': 'avaliado' if nota is not None else 'pendente'
        })
        
        return {'success': True, 'message': 'Nota atualizada com sucesso'}
    except Exception as e:
        return {'success': False, 'message': f'Erro ao atualizar nota: {str(e)}'}


def gerar_boletim_educando(
    id_matricula: int,
    id_turma: int
) -> Dict:
    """
    Gera boletim completo de um educando (todas as disciplinas)
    """
    educando = EducandoResponsavelModel.find_by_id(id_matricula)
    if not educando:
        return {'success': False, 'message': 'Educando não encontrado'}
    
    # Buscar disciplinas da turma (precisa implementar isso)
    # Por enquanto, retornar estrutura básica
    
    return {
        'success': True,
        'educando': {
            'idMatricula': id_matricula,
            'nomeCompleto': educando['nomeCompleto']
        },
        'idTurma': id_turma,
        'disciplinas': []  # TODO: implementar busca de disciplinas
    }
