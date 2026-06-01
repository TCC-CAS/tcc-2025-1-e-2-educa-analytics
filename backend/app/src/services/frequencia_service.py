"""
Serviço de gerenciamento de frequência dos educandos
"""
from typing import List, Dict, Optional
from datetime import datetime, date
from ..models.models import (
    FrequenciaEducandoModel,
    EducandoResponsavelModel,
    TurmaModel,
    DisciplinaModel,
    HistoricoEscolarModel
)


def registrar_frequencia_aula(
    id_turma: int,
    id_disciplina: int,
    id_educador: int,
    data_aula: str,
    registros: List[Dict]
) -> Dict:
    """
    Registra frequência de uma aula
    
    Args:
        id_turma: ID da turma
        id_disciplina: ID da disciplina
        id_educador: ID do educador que está registrando
        data_aula: Data da aula (formato: YYYY-MM-DD)
        registros: Lista de dicts com {idMatricula, status, observacao}
    
    Returns:
        Dict com resultado da operação
    """
    if not registros:
        return {'success': False, 'message': 'Nenhum registro informado'}
    
    # Validar status
    status_validos = ['presente', 'ausente', 'justificado']
    
    # Preparar registros completos
    registros_completos = []
    for reg in registros:
        if reg.get('status') not in status_validos:
            return {'success': False, 'message': f'Status inválido: {reg.get("status")}'}
        
        registros_completos.append({
            'idMatricula': reg['idMatricula'],
            'idTurma': id_turma,
            'idDisciplina': id_disciplina,
            'idEducador': id_educador,
            'data': data_aula,
            'status': reg['status'],
            'observacao': reg.get('observacao')
        })
    
    # Salvar registros
    try:
        count = FrequenciaEducandoModel.salvar_lote(registros_completos)
        return {
            'success': True,
            'message': f'Frequência registrada para {count} educando(s)',
            'count': count
        }
    except Exception as e:
        return {'success': False, 'message': f'Erro ao salvar: {str(e)}'}


def buscar_frequencia_aula(
    id_turma: int,
    id_disciplina: int,
    data_aula: str
) -> Dict:
    """
    Busca registros de frequência de uma aula específica
    """
    registros = FrequenciaEducandoModel.find_by_turma_disciplina_data(
        id_turma, id_disciplina, data_aula
    )
    
    # Se não há registros, retornar lista de educandos da turma com status padrão
    if not registros:
        educandos = obter_educandos_turma(id_turma)
        registros = [
            {
                'idMatricula': edu['idMatricula'],
                'nomeEducando': edu['nomeCompleto'],
                'status': 'presente',
                'observacao': None
            }
            for edu in educandos
        ]
    
    return {
        'data': data_aula,
        'idTurma': id_turma,
        'idDisciplina': id_disciplina,
        'registros': registros
    }


def buscar_datas_registradas(id_turma: int, id_disciplina: int) -> List[str]:
    """
    Retorna lista de datas com frequência registrada
    """
    return FrequenciaEducandoModel.find_datas_registradas(id_turma, id_disciplina)


def gerar_relatorio_frequencia_turma(
    id_turma: int,
    id_disciplina: int
) -> Dict:
    """
    Gera relatório consolidado de frequência da turma
    """
    relatorio = FrequenciaEducandoModel.relatorio_turma(id_turma, id_disciplina)
    
    # Buscar informações da turma e disciplina
    turma = TurmaModel.find_by_id(id_turma)
    disciplina = DisciplinaModel.find_by_id(id_disciplina)
    
    return {
        'turma': {
            'idTurma': id_turma,
            'nomeTurma': turma['nomeTurma'] if turma else 'Desconhecida',
            'codTurma': turma.get('codTurma') if turma else ''
        },
        'disciplina': {
            'idDisciplina': id_disciplina,
            'nomeDisciplina': disciplina['nomeDisciplina'] if disciplina else 'Desconhecida'
        },
        'educandos': relatorio
    }


def gerar_relatorio_frequencia_educando(
    id_matricula: int,
    id_turma: int,
    id_disciplina: int
) -> Dict:
    """
    Gera relatório de frequência de um educando específico
    """
    resumo = FrequenciaEducandoModel.relatorio_educando(
        id_matricula, id_turma, id_disciplina
    )
    
    # Buscar informações do educando
    educando = EducandoResponsavelModel.find_by_id(id_matricula)
    
    return {
        'educando': {
            'idMatricula': id_matricula,
            'nomeCompleto': educando['nomeCompleto'] if educando else 'Desconhecido'
        },
        'resumo': resumo
    }


def obter_educandos_turma(id_turma: int) -> List[Dict]:
    """
    Retorna lista de educandos matriculados na turma
    """
    rows = HistoricoEscolarModel.find_by_turma(id_turma)
    
    educandos = []
    for row in rows:
        if row.get('situacao') == 'Cursando':
            educando = EducandoResponsavelModel.find_by_id(row['idMatricula'])
            if educando:
                educandos.append(educando)
    
    return educandos


def atualizar_frequencia_data(
    id_turma: int,
    id_disciplina: int,
    id_educador: int,
    data_aula: str,
    registros: List[Dict]
) -> Dict:
    """
    Atualiza frequência de uma data já registrada
    """
    return registrar_frequencia_aula(
        id_turma, id_disciplina, id_educador, data_aula, registros
    )
