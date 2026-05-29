"""
Serviço de Educadores para o sistema de cronograma
"""

from ..models.models import EducadorModel


def listar_educadores(status: str = 'ativo') -> dict:
    """
    Lista educadores ativos
    
    Args:
        status: Status para filtrar (default: 'ativo')
    
    Returns:
        Dict com success, data e message
    """
    try:
        educadores = EducadorModel.find_all(status=status)
        
        # Normalizar campos para o frontend
        educadores_normalizados = []
        for edu in educadores:
            educadores_normalizados.append({
                "id": edu["idEducador"],
                "matricula": edu.get("matricula"),
                "nome": edu["nomeCompleto"],
                "email": edu.get("email"),
                "especialidade": edu.get("especialidade"),
                "status": edu.get("status")
            })
        
        return {
            "success": True,
            "data": educadores_normalizados,
            "message": f"{len(educadores_normalizados)} educador(es) encontrado(s)"
        }
    
    except Exception as e:
        print(f"[ERROR listar_educadores] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar educadores: {str(e)}"
        }


def buscar_educador(id_educador: int) -> dict:
    """
    Busca um educador específico por ID
    
    Args:
        id_educador: ID do educador
    
    Returns:
        Dict com success, data e message
    """
    try:
        educador = EducadorModel.find_by_id(id_educador)
        
        if not educador:
            return {
                "success": False,
                "data": None,
                "message": f"Educador {id_educador} não encontrado"
            }
        
        # Normalizar para o frontend
        educador_normalizado = {
            "id": educador["idEducador"],
            "matricula": educador.get("matricula"),
            "nome": educador["nomeCompleto"],
            "email": educador.get("email"),
            "especialidade": educador.get("especialidade"),
            "status": educador.get("status")
        }
        
        return {
            "success": True,
            "data": educador_normalizado,
            "message": "Educador encontrado"
        }
    
    except Exception as e:
        print(f"[ERROR buscar_educador] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": None,
            "message": f"Erro ao buscar educador: {str(e)}"
        }


def listar_educadores_por_disciplina(id_disciplina: int, status: str = 'ativo') -> dict:
    """
    Lista educadores que lecionam uma disciplina específica
    
    Args:
        id_disciplina: ID da disciplina
        status: Status para filtrar (default: 'ativo')
    
    Returns:
        Dict com success, data e message
    """
    try:
        educadores = EducadorModel.find_by_disciplina(id_disciplina, status=status)
        
        # Normalizar campos para o frontend
        educadores_normalizados = []
        for edu in educadores:
            educadores_normalizados.append({
                "id": edu["idEducador"],
                "matricula": edu.get("matricula"),
                "nome": edu["nomeCompleto"],
                "email": edu.get("email"),
                "especialidade": edu.get("especialidade"),
                "status": edu.get("status")
            })
        
        return {
            "success": True,
            "data": educadores_normalizados,
            "message": f"{len(educadores_normalizados)} educador(es) encontrado(s) para esta disciplina"
        }
    
    except Exception as e:
        print(f"[ERROR listar_educadores_por_disciplina] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao listar educadores: {str(e)}"
        }
