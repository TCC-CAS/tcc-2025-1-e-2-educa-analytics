"""
Service para gerenciar Séries do Ensino Fundamental
"""
from app.src.adapters.db_adapter import execute_query


def listar_series(nivel_ensino=None, ativo=True):
    """Lista todas as séries do sistema"""
    try:
        query = "SELECT * FROM series WHERE 1=1"
        params = []
        
        if nivel_ensino:
            query += " AND nivel_ensino = %s"
            params.append(nivel_ensino)
        
        if ativo is not None:
            query += " AND ativo = %s"
            params.append(ativo)
        
        query += " ORDER BY ano_escolar"
        
        series = execute_query(query, tuple(params))
        return {
            "sucesso": True,
            "series": series,
            "total": len(series)
        }
    except Exception as e:
        print(f"[series_service] Erro ao listar séries: {e}")
        return {"sucesso": False, "series": [], "total": 0, "erro": str(e)}


def buscar_serie_por_id(id_serie):
    """Busca uma série específica"""
    try:
        query = "SELECT * FROM series WHERE idSerie = %s"
        resultado = execute_query(query, (id_serie,))
        
        if resultado:
            return {"sucesso": True, "serie": resultado[0]}
        else:
            return {"sucesso": False, "erro": "Série não encontrada"}
    except Exception as e:
        print(f"[series_service] Erro ao buscar série: {e}")
        return {"sucesso": False, "erro": str(e)}


def listar_disciplinas_serie(id_serie):
    """Lista disciplinas da matriz curricular de uma série"""
    try:
        query = """
            SELECT 
                mc.idMatrizCurricular,
                mc.idSerie,
                mc.idDisciplina,
                mc.carga_horaria_semanal,
                mc.carga_horaria_anual,
                mc.obrigatoria,
                d.codDisciplina,
                d.nomeDisciplina,
                d.areaConhecimento
            FROM matriz_curricular mc
            INNER JOIN Disciplinas d ON mc.idDisciplina = d.idDisciplina
            WHERE mc.idSerie = %s AND mc.ativo = TRUE
            ORDER BY d.nomeDisciplina
        """
        
        disciplinas = execute_query(query, (id_serie,))
        return {
            "sucesso": True,
            "disciplinas": disciplinas,
            "total": len(disciplinas)
        }
    except Exception as e:
        print(f"[series_service] Erro ao listar disciplinas da série: {e}")
        return {"sucesso": False, "disciplinas": [], "total": 0, "erro": str(e)}
