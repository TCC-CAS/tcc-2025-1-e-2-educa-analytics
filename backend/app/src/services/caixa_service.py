"""
Serviço de Caixa — CRUD completo.
Tabela: Caixa
"""
from __future__ import annotations

import json

from app.src.adapters.db_adapter import execute_query, execute_write


# ── Auto-migração de colunas ausentes ─────────────────────────────────────────

def _add_col_if_missing(table: str, col: str, definition: str) -> None:
    rows = execute_query(
        "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
        (table, col),
    )
    if rows[0]["cnt"] == 0:
        execute_write(f"ALTER TABLE `{table}` ADD COLUMN `{col}` {definition}")


try:
    execute_write("""
        CREATE TABLE IF NOT EXISTS Caixa (
            idLancamento  INT           NOT NULL AUTO_INCREMENT,
            data          DATE          NOT NULL,
            tipoOperacao  VARCHAR(10)   NOT NULL DEFAULT 'saida',
            formaPagamento VARCHAR(50)  DEFAULT NULL,
            tipoDespesa   VARCHAR(50)   DEFAULT NULL,
            centroCusto   VARCHAR(100)  DEFAULT NULL,
            descricao     VARCHAR(200)  DEFAULT NULL,
            fornecedor    VARCHAR(150)  DEFAULT NULL,
            usuario       VARCHAR(100)  DEFAULT NULL,
            valorDespesa  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            idMatricula   VARCHAR(20)   DEFAULT NULL,
            PRIMARY KEY (idLancamento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    _add_col_if_missing("Caixa", "centroCusto", "VARCHAR(100) DEFAULT NULL")
    _add_col_if_missing("Caixa", "descricao",   "VARCHAR(200) DEFAULT NULL")
    _add_col_if_missing("Caixa", "fornecedor",  "VARCHAR(150) DEFAULT NULL")
    _add_col_if_missing("Caixa", "usuario",     "VARCHAR(100) DEFAULT NULL")
    _add_col_if_missing("Caixa", "projetado",        "TINYINT(1) NOT NULL DEFAULT 0")
    _add_col_if_missing("Caixa", "tipoRecebimento",  "VARCHAR(20) DEFAULT NULL")
    _add_col_if_missing("Caixa", "idEducando",       "VARCHAR(30) DEFAULT NULL")
    _add_col_if_missing("Caixa", "nomeEducando",     "VARCHAR(200) DEFAULT NULL")
    _add_col_if_missing("Caixa", "mesReferencia",    "VARCHAR(7) DEFAULT NULL")
    _add_col_if_missing("Caixa", "anoLetivo",        "VARCHAR(4) DEFAULT NULL")

    # Converte tipoOperacao de ENUM para VARCHAR para aceitar 'entrada'/'saida'
    rows = execute_query(
        "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Caixa' AND COLUMN_NAME = 'tipoOperacao'"
    )
    if rows and rows[0].get("DATA_TYPE", "").upper() == "ENUM":
        execute_write(
            "ALTER TABLE `Caixa` MODIFY COLUMN `tipoOperacao` VARCHAR(10) NOT NULL DEFAULT 'saida'"
        )

    print("[OK] [STARTUP] Migrações de Caixa verificadas")
except Exception as e:
    print(f"[WARN] [STARTUP] Migrações de Caixa ignoradas: {type(e).__name__}")


# ── helpers ───────────────────────────────────────────────────────────────────

_TIPO_MAP = {"receita": "entrada", "despesa": "saida"}


def _format_item(row: dict) -> dict:
    tipo = row.get("tipoOperacao") or "saida"
    tipo = _TIPO_MAP.get(tipo, tipo)  # normaliza legado receita/despesa

    return {
        "id": row["idLancamento"],
        "data": str(row["data"]) if row.get("data") else "",
        "tipoConta": tipo,
        "formaPagamento": row.get("formaPagamento") or "",
        "centroCusto": row.get("centroCusto") or "",
        "descricao": row.get("descricao") or "",
        "fornecedor": row.get("fornecedor") or "",
        "valor": float(row.get("valorDespesa") or 0),
        "usuario": row.get("usuario") or "",
        "tipoDespesa":      row.get("tipoDespesa") or "",
        "projetado":        bool(row.get("projetado") or 0),
        "tipoRecebimento":  row.get("tipoRecebimento") or "",
        "idEducando":       row.get("idEducando") or "",
        "nomeEducando":     row.get("nomeEducando") or "",
        "mesReferencia":    row.get("mesReferencia") or "",
        "anoLetivo":        row.get("anoLetivo") or "",
    }


# ── endpoints ─────────────────────────────────────────────────────────────────

def listar_lancamentos() -> list[dict]:
    """Retorna apenas lançamentos efetivos (não projetados)."""
    rows = execute_query(
        "SELECT * FROM Caixa WHERE projetado = 0 ORDER BY data DESC, idLancamento DESC"
    )
    return [_format_item(r) for r in rows]


def listar_fluxo_projetado(dias: int = 30) -> list[dict]:
    """Retorna projeções futuras dentro dos próximos `dias` dias (padrão: 30)."""
    rows = execute_query(
        """
        SELECT * FROM Caixa
        WHERE projetado = 1
          AND data >= CURDATE()
          AND data <= DATE_ADD(CURDATE(), INTERVAL %s DAY)
        ORDER BY data ASC, idLancamento ASC
        """,
        (int(dias),),
    )
    return [_format_item(r) for r in rows]


def buscar_lancamento(id_lancamento: int) -> dict | None:
    rows = execute_query(
        "SELECT * FROM Caixa WHERE idLancamento = %s LIMIT 1",
        (id_lancamento,),
    )
    return _format_item(rows[0]) if rows else None


def criar_lancamento(body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    if not data.get("data"):
        raise ValueError("data é obrigatória")
    if not data.get("tipoConta"):
        raise ValueError("tipoConta é obrigatório")
    if not data.get("valor") or float(data["valor"]) <= 0:
        raise ValueError("valor deve ser maior que zero")
    if not data.get("descricao"):
        raise ValueError("descricao é obrigatória")

    id_lancamento = execute_write(
        """
        INSERT INTO Caixa
            (data, tipoOperacao, formaPagamento, tipoDespesa,
             centroCusto, descricao, fornecedor, valorDespesa, usuario, projetado,
             tipoRecebimento, idEducando, nomeEducando, mesReferencia, anoLetivo)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            data["data"],
            data["tipoConta"],
            data.get("formaPagamento") or None,
            data.get("tipoDespesa") or None,
            data.get("centroCusto") or None,
            data["descricao"],
            data.get("fornecedor") or None,
            float(data["valor"]),
            data.get("usuario") or None,
            1 if data.get("projetado") else 0,
            data.get("tipoRecebimento") or None,
            data.get("idEducando") or None,
            data.get("nomeEducando") or None,
            data.get("mesReferencia") or None,
            data.get("anoLetivo") or None,
        ),
    )
    return buscar_lancamento(id_lancamento)


def atualizar_lancamento(id_lancamento: int, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    if not buscar_lancamento(id_lancamento):
        raise ValueError(f"Lançamento {id_lancamento} não encontrado")

    execute_write(
        """
        UPDATE Caixa SET
            data=%s, tipoOperacao=%s, formaPagamento=%s, tipoDespesa=%s,
            centroCusto=%s, descricao=%s, fornecedor=%s, valorDespesa=%s, usuario=%s, projetado=%s,
            tipoRecebimento=%s, idEducando=%s, nomeEducando=%s, mesReferencia=%s, anoLetivo=%s
        WHERE idLancamento = %s
        """,
        (
            data.get("data"),
            data.get("tipoConta"),
            data.get("formaPagamento") or None,
            data.get("tipoDespesa") or None,
            data.get("centroCusto") or None,
            data.get("descricao"),
            data.get("fornecedor") or None,
            float(data.get("valor") or 0),
            data.get("usuario") or None,
            1 if data.get("projetado") else 0,
            data.get("tipoRecebimento") or None,
            data.get("idEducando") or None,
            data.get("nomeEducando") or None,
            data.get("mesReferencia") or None,
            data.get("anoLetivo") or None,
            id_lancamento,
        ),
    )
    return buscar_lancamento(id_lancamento)


def excluir_lancamento(id_lancamento: int) -> dict:
    if not buscar_lancamento(id_lancamento):
        raise ValueError(f"Lançamento {id_lancamento} não encontrado")
    execute_write("DELETE FROM Caixa WHERE idLancamento = %s", (id_lancamento,))
    return {"deleted": id_lancamento}


def excluir_lote(ids: list[int]) -> dict:
    if not ids:
        return {"deleted": 0}
    ph = ",".join(["%s"] * len(ids))
    execute_write(f"DELETE FROM Caixa WHERE idLancamento IN ({ph})", tuple(ids))
    return {"deleted": len(ids)}
