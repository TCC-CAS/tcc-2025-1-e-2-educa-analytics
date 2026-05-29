"""
Serviço de Matriz Curricular — CRUD + Histórico + Cópia entre anos.

A matriz curricular define quais disciplinas são lecionadas em cada
série do Ensino Fundamental e suas respectivas cargas horárias.

Conceitos:
    QAS  — Quantidade de Aulas Semanais (= cargaHorariaSemanal no BD)
    CH   — Carga Horária Anual = QAS × 40  (40 semanas letivas)
"""
from __future__ import annotations
import traceback

from app.src.models.models import MatrizCurricularModel, DisciplinaModel


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalizar(m: dict) -> dict:
    """Converte uma linha do BD para o formato esperado pelo frontend."""
    qas = m.get("cargaHorariaSemanal", 0)
    return {
        "id":                   m.get("idMatriz"),
        "serie":                m.get("serie"),
        "idDisciplina":         m.get("idDisciplina"),
        "cargaHorariaSemanal":  qas,
        "cargaHorariaAnual":    m.get("cargaHorariaAnual") or qas * 40,
        "anoLetivo":            m.get("anoLetivo"),
        "status":               m.get("status", "ativa"),
        "observacoes":          m.get("observacoes"),
        "criadoEm":             str(m["criadoEm"])    if m.get("criadoEm")     else None,
        "atualizadoEm":         str(m["atualizadoEm"]) if m.get("atualizadoEm") else None,
        "disciplina": {
            "id":               m.get("idDisciplina"),
            "codigo":           m.get("codDisciplina", ""),
            "nome":             m.get("nomeDisciplina", ""),
            "areaConhecimento": m.get("areaConhecimento", ""),
        }
    }


# ── CRUD ──────────────────────────────────────────────────────────────────────

def listar_matriz_curricular(
    ano_letivo: int | None = None,
    serie: str | None = None
) -> dict:
    """
    Lista a matriz curricular, opcionalmente filtrada por ano letivo e/ou série.

    Returns:
        dict com success=True e data=[...] ou success=False e message
    """
    try:
        if serie and ano_letivo:
            matrizes = MatrizCurricularModel.find_by_serie(serie, ano_letivo)
        else:
            matrizes = MatrizCurricularModel.find_all(ano_letivo=ano_letivo)

        return {"success": True, "data": [_normalizar(m) for m in matrizes]}

    except Exception as e:
        print(f"[ERROR listar_matriz_curricular] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao listar matriz curricular: {e}"}


def buscar_matriz_curricular(id_matriz: int) -> dict:
    """Busca uma entrada específica pelo ID."""
    try:
        m = MatrizCurricularModel.find_by_id(id_matriz)
        if not m:
            return {"success": False, "message": "Entrada não encontrada"}

        return {"success": True, "data": _normalizar(m)}

    except Exception as e:
        print(f"[ERROR buscar_matriz_curricular] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao buscar entrada: {e}"}


def criar_matriz_curricular(body: str | dict) -> dict:
    """
    Cria uma nova entrada na matriz curricular.

    Campos obrigatórios no body:
        serie, idDisciplina, cargaHorariaSemanal, anoLetivo
    """
    try:
        if isinstance(body, str):
            import json
            data = json.loads(body)
        else:
            data = body

        # Validações
        erros = []
        if not data.get("serie"):           erros.append("'serie'")
        if not data.get("idDisciplina"):    erros.append("'idDisciplina'")
        if not data.get("cargaHorariaSemanal"): erros.append("'cargaHorariaSemanal'")
        if not data.get("anoLetivo"):       erros.append("'anoLetivo'")
        if erros:
            return {"success": False,
                    "message": f"Campos obrigatórios ausentes: {', '.join(erros)}"}

        if int(data["cargaHorariaSemanal"]) <= 0:
            return {"success": False, "message": "cargaHorariaSemanal deve ser > 0"}

        # Disciplina existe?
        disc = DisciplinaModel.find_by_id(int(data["idDisciplina"]))
        if not disc:
            return {"success": False, "message": "Disciplina não encontrada"}

        id_novo = MatrizCurricularModel.create(data)

        # Registrar histórico
        entrada = MatrizCurricularModel.find_by_id(id_novo)
        if entrada:
            MatrizCurricularModel.record_history(
                entrada, "criado",
                data.get("motivoAlteracao")
            )

        return {
            "success": True,
            "data": _normalizar(entrada) if entrada else {"id": id_novo},
            "message": "Entrada criada com sucesso"
        }

    except Exception as e:
        print(f"[ERROR criar_matriz_curricular] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao criar entrada: {e}"}


def atualizar_matriz_curricular(id_matriz: int, body: str | dict) -> dict:
    """Atualiza uma entrada existente na matriz curricular."""
    try:
        entrada_antes = MatrizCurricularModel.find_by_id(id_matriz)
        if not entrada_antes:
            return {"success": False, "message": "Entrada não encontrada"}

        if isinstance(body, str):
            import json
            data = json.loads(body)
        else:
            data = body

        # Validações
        erros = []
        if not data.get("serie"):           erros.append("'serie'")
        if not data.get("idDisciplina"):    erros.append("'idDisciplina'")
        if not data.get("cargaHorariaSemanal"): erros.append("'cargaHorariaSemanal'")
        if erros:
            return {"success": False,
                    "message": f"Campos obrigatórios ausentes: {', '.join(erros)}"}

        disc = DisciplinaModel.find_by_id(int(data["idDisciplina"]))
        if not disc:
            return {"success": False, "message": "Disciplina não encontrada"}

        # Gravar snapshot anterior no histórico
        MatrizCurricularModel.record_history(
            entrada_antes, "atualizado",
            data.get("motivoAlteracao")
        )

        MatrizCurricularModel.update(id_matriz, data)

        entrada_nova = MatrizCurricularModel.find_by_id(id_matriz)
        return {
            "success": True,
            "data": _normalizar(entrada_nova) if entrada_nova else {"id": id_matriz},
            "message": "Entrada atualizada com sucesso"
        }

    except Exception as e:
        print(f"[ERROR atualizar_matriz_curricular] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao atualizar entrada: {e}"}


def excluir_matriz_curricular(id_matriz: int) -> dict:
    """Remove uma entrada da matriz curricular (com registro no histórico)."""
    try:
        entrada = MatrizCurricularModel.find_by_id(id_matriz)
        if not entrada:
            return {"success": False, "message": "Entrada não encontrada"}

        # Gravar no histórico antes de excluir
        MatrizCurricularModel.record_history(entrada, "excluido")

        MatrizCurricularModel.delete(id_matriz)
        return {"success": True, "message": "Entrada excluída com sucesso"}

    except Exception as e:
        print(f"[ERROR excluir_matriz_curricular] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao excluir entrada: {e}"}


# ── Séries / Anos ─────────────────────────────────────────────────────────────

def listar_series(ano_letivo: int) -> dict:
    """Lista todas as séries disponíveis para um ano letivo."""
    try:
        series = MatrizCurricularModel.find_series(ano_letivo)
        return {"success": True, "data": series}
    except Exception as e:
        print(f"[ERROR listar_series] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao listar séries: {e}"}


def listar_anos_letivos() -> dict:
    """Lista todos os anos letivos com matriz cadastrada."""
    try:
        anos = MatrizCurricularModel.find_anos_letivos()
        return {"success": True, "data": anos}
    except Exception as e:
        print(f"[ERROR listar_anos_letivos] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao listar anos letivos: {e}"}


# ── Cópia entre anos ──────────────────────────────────────────────────────────

def copiar_para_ano(body: str | dict) -> dict:
    """
    Copia a matriz curricular de um ano letivo para outro.

    Body esperado:
        anoOrigem  (obrigatório)
        anoDestino (obrigatório)
        series     (opcional — lista de séries; copia tudo se omitido)

    Entradas que já existem no ano destino são ignoradas
    (INSERT IGNORE), preservando personalizações já feitas.
    """
    try:
        if isinstance(body, str):
            import json
            data = json.loads(body)
        else:
            data = body

        ano_origem  = data.get("anoOrigem")
        ano_destino = data.get("anoDestino")
        series      = data.get("series")  # list | None

        if not ano_origem or not ano_destino:
            return {"success": False,
                    "message": "Campos 'anoOrigem' e 'anoDestino' são obrigatórios"}

        ano_origem  = int(ano_origem)
        ano_destino = int(ano_destino)

        if ano_origem == ano_destino:
            return {"success": False,
                    "message": "Ano de origem e destino não podem ser iguais"}

        resultado = MatrizCurricularModel.copy_to_year(
            ano_origem, ano_destino, series
        )

        if resultado["copiadas"] == 0 and resultado["ignoradas"] == 0:
            return {
                "success": False,
                "message": f"Nenhuma entrada encontrada no ano letivo {ano_origem}"
                           + (f" para as séries {series}" if series else "")
            }

        return {
            "success": True,
            "data": resultado,
            "message": (
                f"{resultado['copiadas']} entrada(s) copiada(s) "
                f"de {ano_origem} para {ano_destino}."
                + (f" {resultado['ignoradas']} já existiam e foram mantidas."
                   if resultado["ignoradas"] else "")
            )
        }

    except Exception as e:
        print(f"[ERROR copiar_para_ano] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao copiar matriz: {e}"}


# ── Salvar série completa ─────────────────────────────────────────────────────

def salvar_serie(body: str | dict) -> dict:
    """
    Cria/atualiza a grade completa de uma série no mesmo ano letivo.

    Body esperado:
        serie         (obrigatório) — ex: '1º Ano'
        anoLetivo     (obrigatório) — ex: 2026
        disciplinas   (obrigatório) — lista de entradas ativas:
                        [ { idDisciplina, cargaHorariaSemanal, observacoes? } ]
        motivoAlteracao (opcional)

    Disciplinas existentes no banco que NÃO estejam na lista
    são automaticamente marcadas como 'inativa'.
    """
    try:
        if isinstance(body, str):
            import json
            data = json.loads(body)
        else:
            data = body

        erros = []
        if not data.get("serie"):         erros.append("'serie'")
        if not data.get("anoLetivo"):     erros.append("'anoLetivo'")
        if "disciplinas" not in data:     erros.append("'disciplinas'")
        if erros:
            return {"success": False,
                    "message": f"Campos obrigatórios ausentes: {', '.join(erros)}"}

        disciplinas = data["disciplinas"]
        if not isinstance(disciplinas, list):
            return {"success": False, "message": "'disciplinas' deve ser uma lista"}

        serie     = data["serie"]
        ano_letivo = int(data["anoLetivo"])
        motivo    = data.get("motivoAlteracao")

        resultado = MatrizCurricularModel.bulk_upsert_serie(
            serie, ano_letivo, disciplinas, motivo
        )

        return {
            "success": True,
            "data": resultado,
            "message": (
                f"Grade da {serie} salva com sucesso. "
                f"{resultado['criados']} adicionada(s), "
                f"{resultado['atualizados']} atualizada(s)"
                + (f", {resultado['inativados']} removida(s)."
                   if resultado["inativados"] else ".")
            )
        }

    except Exception as e:
        print(f"[ERROR salvar_serie] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao salvar série: {e}"}


# ── Histórico ─────────────────────────────────────────────────────────────────

def listar_historico(
    serie: str | None = None,
    ano_letivo: int | None = None,
    id_matriz: int | None = None,
    limit: int = 50
) -> dict:
    """
    Lista o histórico de alterações da matriz curricular.

    Pode filtrar por série, ano letivo ou ID de entrada específica.
    """
    try:
        registros = MatrizCurricularModel.find_historico(
            serie=serie,
            ano_letivo=ano_letivo,
            id_matriz=id_matriz,
            limit=limit
        )

        # Mapear ações de volta para o formato esperado pelo frontend
        acao_map = {
            'criacao': 'criado',
            'alteracao': 'atualizado',
            'exclusao': 'excluido'
        }

        result = []
        for r in registros:
            result.append({
                "id":                   r.get("idHistorico"),
                "idMatriz":             r.get("idMatriz"),
                "serie":                r.get("serie"),
                "idDisciplina":         r.get("idDisciplina"),
                "nomeDisciplina":       r.get("nomeDisc") or r.get("nomeDisciplina"),
                "codDisciplina":        r.get("codDisciplina"),
                "cargaHorariaSemanal":  r.get("cargaHorariaSemanal"),
                "cargaHorariaAnual":    r.get("cargaHorariaAnual"),
                "anoLetivo":            r.get("anoLetivo"),
                "status":               r.get("status"),
                "acao":                 acao_map.get(r.get("acao"), r.get("acao")),
                "motivoAlteracao":      r.get("motivoAlteracao"),
                "registradoEm":         str(r["registradoEm"]) if r.get("registradoEm") else None,
            })

        return {"success": True, "data": result}

    except Exception as e:
        print(f"[ERROR listar_historico] {e}")
        traceback.print_exc()
        return {"success": False, "message": f"Erro ao listar histórico: {e}"}
