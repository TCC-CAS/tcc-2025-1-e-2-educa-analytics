"""
Serviço de turmas — operações CRUD completas.

Mapeamentos frontend ↔ banco:
  turno  ↔  periodo  : 'Manhã'/'Tarde'/'Noite'/'Integral' ↔ 'matutino'/'vespertino'/'noturno'/'integral'
  status              : 'ativa'/'inativa' ↔ 'ativa'/'encerrada'
  codigo ↔  codTurma
  nome   ↔  nomeTurma
  vagas  ↔  qldVagas
  inicioAulas ↔ dataInicio
  fimAulas    ↔ dataFim
"""
from __future__ import annotations

import json

from app.src.models.models import TurmaModel, SalaModel

# ── mapeamentos ───────────────────────────────────────────────────────────────

_TURNO_TO_PERIODO: dict[str, str] = {
    "Manhã":    "matutino",
    "Tarde":    "vespertino",
    "Noite":    "noturno",
    "Integral": "integral",
}
_PERIODO_TO_TURNO: dict[str, str] = {v: k for k, v in _TURNO_TO_PERIODO.items()}

_STATUS_TO_DB: dict[str, str] = {
    "ativa":   "ativa",
    "inativa": "encerrada",
}
_STATUS_FROM_DB: dict[str, str] = {
    "ativa":     "ativa",
    "encerrada": "inativa",
    "suspensa":  "inativa",
}


# ── helpers internos ──────────────────────────────────────────────────────────

def _format_turma(row: dict) -> dict:
    periodo   = str(row.get("periodo") or "")
    status_db = str(row.get("status") or "ativa").lower()
    return {
        "id":           int(row.get("idTurma") or 0),
        "idSala":       row.get("idSala"),
        "codigo":       row.get("codTurma") or "",
        "nome":         row.get("nomeTurma") or "",
        "turno":        _PERIODO_TO_TURNO.get(periodo, periodo),
        "anoLetivo":    str(row.get("anoLetivo") or ""),
        "serie":        row.get("serie") or "",
        "sala":         row.get("nomeSala") or "",
        "status":       _STATUS_FROM_DB.get(status_db, "inativa"),
        "vagas":        int(row.get("qldVagas") or 30),
        "vagasOcupadas": int(row.get("vagasOcupadas") or 0),
        "inicioAulas":  str(row.get("dataInicioFmt") or row.get("dataInicio") or ""),
        "fimAulas":     str(row.get("dataFimFmt")    or row.get("dataFim")    or ""),
    }


def _parse_body(body: str | dict) -> dict:
    data: dict = json.loads(body) if isinstance(body, str) else dict(body)

    # turno → periodo
    if "turno" in data and "periodo" not in data:
        data["periodo"] = _TURNO_TO_PERIODO.get(data["turno"], data["turno"])

    # status frontend → DB
    if "status" in data:
        data["status"] = _STATUS_TO_DB.get(data["status"], data["status"])

    # aliases enviados pelo frontend
    if "codigo" in data and "codTurma" not in data:
        data["codTurma"] = data["codigo"]
    if "nome" in data and "nomeTurma" not in data:
        data["nomeTurma"] = data["nome"]
    if "vagas" in data and "qldVagas" not in data:
        data["qldVagas"] = data["vagas"]
    if "inicioAulas" in data and "dataInicio" not in data:
        data["dataInicio"] = data["inicioAulas"] or None
    if "fimAulas" in data and "dataFim" not in data:
        data["dataFim"] = data["fimAulas"] or None

    # Resolve idSala: frontend pode enviar idSala (int) ou sala (nome texto)
    if "idSala" not in data or data.get("idSala") is None:
        sala_nome = data.get("sala", "")
        if sala_nome:
            sala_row = SalaModel.find_by_nome(sala_nome)
            if sala_row:
                data["idSala"] = sala_row["idSala"]

    return data


def _validar(data: dict) -> list[str]:
    erros: list[str] = []
    for campo in ("codTurma", "nomeTurma", "periodo", "anoLetivo"):
        if not data.get(campo):
            erros.append(f"{campo} é obrigatório")
    return erros


# ── endpoints ─────────────────────────────────────────────────────────────────

def listar_salas() -> list[dict]:
    rows = SalaModel.find_all()
    return [
        {
            "idSala":    int(r.get("idSala") or 0),
            "codSala":   r.get("codSala") or "",
            "nomeSala":  r.get("nomeSala") or "",
            "tipoSala":  r.get("tipoSala") or "",
            "status":    r.get("status") or "",
            "capacidade": int(r.get("capacidade") or 0),
            "bloco":     r.get("bloco") or "",
            "andar":     r.get("andar") or "",
        }
        for r in rows
    ]


def listar_turmas() -> list[dict]:
    rows = TurmaModel.find_all_with_sala()
    return [_format_turma(r) for r in rows]


def buscar_turma(id_turma: int) -> dict | None:
    row = TurmaModel.find_by_id(id_turma)
    if not row:
        return None
    result = _format_turma(row)
    result["educandos"] = TurmaModel.find_educandos(id_turma)
    return result


def criar_turma(body: str | dict) -> dict:
    data = _parse_body(body)
    erros = _validar(data)
    if erros:
        raise ValueError("; ".join(erros))

    if TurmaModel.find_by_cod_ano(data["codTurma"], str(data["anoLetivo"])):
        raise ValueError(
            f"Turma com código {data['codTurma']} já existe para o ano {data['anoLetivo']}"
        )

    id_turma = TurmaModel.create(data)
    row = TurmaModel.find_by_id(id_turma)
    return _format_turma(row)


def atualizar_turma(id_turma: int, body: str | dict) -> dict:
    if not TurmaModel.find_by_id(id_turma):
        raise ValueError(f"Turma {id_turma} não encontrada")

    data = _parse_body(body)
    erros = _validar(data)
    if erros:
        raise ValueError("; ".join(erros))

    TurmaModel.update(id_turma, data)
    row = TurmaModel.find_by_id(id_turma)
    return _format_turma(row)


def deletar_turma(id_turma: int) -> None:
    if not TurmaModel.find_by_id(id_turma):
        raise ValueError(f"Turma {id_turma} não encontrada")
    TurmaModel.delete(id_turma)


def alterar_status(id_turma: int, status_frontend: str) -> dict:
    if not TurmaModel.find_by_id(id_turma):
        raise ValueError(f"Turma {id_turma} não encontrada")
    status_db = _STATUS_TO_DB.get(status_frontend, status_frontend)
    TurmaModel.update_status(id_turma, status_db)
    return {"idTurma": id_turma, "status": status_frontend}


def alterar_status_lote(ids: list[int], status_frontend: str) -> int:
    if not ids:
        raise ValueError("ids é obrigatório")
    status_db = _STATUS_TO_DB.get(status_frontend, status_frontend)
    return TurmaModel.update_status_lote(ids, status_db)


def listar_educandos_turma(id_turma: int) -> list[dict]:
    return TurmaModel.find_educandos(id_turma)


def listar_anos_letivos() -> list[int]:
    """
    Lista todos os anos letivos disponíveis com turmas ativas
    
    Returns:
        Lista de anos letivos (int) ordenados decrescente
    """
    from ..adapters.db_adapter import execute_query
    
    anos = execute_query(
        """
        SELECT DISTINCT anoLetivo 
        FROM Turmas 
        WHERE status = 'ativa' AND anoLetivo IS NOT NULL
        ORDER BY anoLetivo DESC
        """
    )
    
    return [int(a["anoLetivo"]) for a in anos]
