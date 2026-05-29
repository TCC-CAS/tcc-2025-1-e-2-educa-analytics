"""
Service para gerenciar Períodos (turnos)
"""
from app.src.adapters.db_adapter import execute_query


def listar_periodos(ativo=True):
    """Lista todos os períodos disponíveis"""
    try:
        query = "SELECT * FROM periodos WHERE 1=1"
        params = []
        
        if ativo is not None:
            query += " AND ativo = %s"
            params.append(ativo)
        
        query += " ORDER BY codigo"
        
        periodos = execute_query(query, tuple(params))
        return {
            "sucesso": True,
            "periodos": periodos,
            "total": len(periodos)
        }
    except Exception as e:
        print(f"[periodos_service] Erro ao listar períodos: {e}")
        return {"sucesso": False, "periodos": [], "total": 0, "erro": str(e)}


def buscar_periodo_por_id(id_periodo):
    """Busca um período específico"""
    try:
        query = "SELECT * FROM periodos WHERE idPeriodo = %s"
        resultado = execute_query(query, (id_periodo,))
        
        if resultado:
            return {"sucesso": True, "periodo": resultado[0]}
        else:
            return {"sucesso": False, "erro": "Período não encontrado"}
    except Exception as e:
        print(f"[periodos_service] Erro ao buscar período: {e}")
        return {"sucesso": False, "erro": str(e)}
