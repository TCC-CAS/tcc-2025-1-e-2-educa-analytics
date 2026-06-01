"""
Service para gerenciar Anos Letivos
"""
from app.src.adapters.db_adapter import execute_query


def listar_anos_letivos(status=None, ativo=True):
    """Lista todos os anos letivos"""
    try:
        query = "SELECT * FROM anos_letivos WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        if ativo is not None:
            query += " AND ativo = %s"
            params.append(ativo)
        
        query += " ORDER BY ano DESC"
        
        anos = execute_query(query, tuple(params))
        return {
            "sucesso": True,
            "anos_letivos": anos,
            "total": len(anos)
        }
    except Exception as e:
        print(f"[anos_letivos_service] Erro ao listar anos letivos: {e}")
        return {"sucesso": False, "anos_letivos": [], "total": 0, "erro": str(e)}


def buscar_ano_letivo_atual():
    """Busca o ano letivo em andamento"""
    try:
        query = "SELECT * FROM anos_letivos WHERE status = 'em_andamento' ORDER BY ano DESC LIMIT 1"
        resultado = execute_query(query, ())
        
        if resultado:
            return {"sucesso": True, "ano_letivo": resultado[0]}
        else:
            # Se não tem ano em andamento, retorna o mais recente
            query = "SELECT * FROM anos_letivos ORDER BY ano DESC LIMIT 1"
            resultado = execute_query(query, ())
            if resultado:
                return {"sucesso": True, "ano_letivo": resultado[0]}
            else:
                return {"sucesso": False, "erro": "Nenhum ano letivo cadastrado"}
    except Exception as e:
        print(f"[anos_letivos_service] Erro ao buscar ano letivo atual: {e}")
        return {"sucesso": False, "erro": str(e)}


def buscar_ano_letivo_por_id(id_ano_letivo):
    """Busca um ano letivo específico"""
    try:
        query = "SELECT * FROM anos_letivos WHERE idAnoLetivo = %s"
        resultado = execute_query(query, (id_ano_letivo,))
        
        if resultado:
            return {"sucesso": True, "ano_letivo": resultado[0]}
        else:
            return {"sucesso": False, "erro": "Ano letivo não encontrado"}
    except Exception as e:
        print(f"[anos_letivos_service] Erro ao buscar ano letivo: {e}")
        return {"sucesso": False, "erro": str(e)}
