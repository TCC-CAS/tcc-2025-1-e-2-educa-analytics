"""
Serviço de Educadores para o sistema de cronograma.
Usa a tabela Educador (idMatricula como PK), que é o que Cronograma.idEducador referencia.
"""

from ..models.models import EducadorModel
from ..adapters.db_adapter import execute_query


def listar_educadores(status: str = 'ativo') -> dict:
    try:
        rows = execute_query(
            "SELECT * FROM Educador WHERE idStatus = %s ORDER BY nomeCompleto",
            (status,)
        )
        return {
            "success": True,
            "data": [_normalizar(e) for e in rows],
            "message": f"{len(rows)} educador(es) encontrado(s)"
        }
    except Exception as e:
        print(f"[ERROR listar_educadores] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "data": [], "message": f"Erro ao listar educadores: {str(e)}"}


def buscar_educador(id_educador: str) -> dict:
    try:
        rows = execute_query(
            "SELECT * FROM Educador WHERE idMatricula = %s LIMIT 1",
            (id_educador,)
        )
        if not rows:
            return {"success": False, "data": None, "message": f"Educador {id_educador} não encontrado"}
        return {"success": True, "data": _normalizar(rows[0]), "message": "Educador encontrado"}
    except Exception as e:
        print(f"[ERROR buscar_educador] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "data": None, "message": f"Erro ao buscar educador: {str(e)}"}


def listar_educadores_por_disciplina(id_disciplina: int, status: str = 'ativo', turno: str = None) -> dict:
    try:
        params = [id_disciplina, status]
        turno_clause = ""
        if turno:
            # Normaliza o turno para comparação flexível
            turno_lower = turno.lower()
            if 'manhã' in turno_lower or 'manha' in turno_lower or turno_lower == 'm':
                turno_clause = "AND (e.turno LIKE '%anhã%' OR e.turno LIKE '%anha%' OR e.turno LIKE '%ntegral%' OR e.turno IS NULL OR e.turno = '')"
            elif 'tarde' in turno_lower or turno_lower == 't':
                turno_clause = "AND (e.turno LIKE '%arde%' OR e.turno LIKE '%ntegral%' OR e.turno IS NULL OR e.turno = '')"
            elif 'noite' in turno_lower or turno_lower == 'n':
                turno_clause = "AND (e.turno LIKE '%oite%' OR e.turno IS NULL OR e.turno = '')"
            # integral: sem filtro adicional (qualquer turno)

        rows = execute_query(
            f"""
            SELECT DISTINCT e.*
            FROM Educador e
            JOIN EducadorDisciplina ed ON ed.idMatricula = e.idMatricula
            WHERE ed.idDisciplina = %s AND e.idStatus = %s
            {turno_clause}
            ORDER BY e.nomeCompleto
            """,
            tuple(params)
        )
        return {
            "success": True,
            "data": [_normalizar(e) for e in rows],
            "message": f"{len(rows)} educador(es) encontrado(s) para esta disciplina"
        }
    except Exception as e:
        print(f"[ERROR listar_educadores_por_disciplina] {e}")
        import traceback; traceback.print_exc()
        return {"success": False, "data": [], "message": f"Erro ao listar educadores: {str(e)}"}


def _normalizar(edu: dict) -> dict:
    return {
        "id": edu.get("idMatricula"),
        "matricula": edu.get("idMatricula"),
        "nome": edu.get("nomeCompleto", ""),
        "email": edu.get("email"),
        "telefone": edu.get("telefone"),
        "especialidade": edu.get("cargo") or edu.get("departamento"),
        "status": edu.get("idStatus", "ativo")
    }
