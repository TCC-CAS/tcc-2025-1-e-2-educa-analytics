"""
Serviço de Fornecedores — CRUD completo.
Tabela: Fornecedores (unificada PF e PJ)
"""
from __future__ import annotations

import json

from app.src.adapters.db_adapter import execute_query, execute_write


# Auto-criação da tabela unificada se não existir
try:
    execute_write(
        """
        CREATE TABLE IF NOT EXISTS Fornecedores (
            idFornecedor      INT             NOT NULL AUTO_INCREMENT,
            tipo              ENUM('PF','PJ') NOT NULL,
            nome              VARCHAR(150)    NOT NULL,
            razaoSocial       VARCHAR(150)    DEFAULT NULL,
            cpfCnpj           VARCHAR(18)     NOT NULL,
            email             VARCHAR(120)    DEFAULT NULL,
            telefone          VARCHAR(20)     DEFAULT NULL,
            cep               VARCHAR(9)      DEFAULT NULL,
            endereco          VARCHAR(200)    DEFAULT NULL,
            centroCusto       VARCHAR(100)    DEFAULT NULL,
            categoria         VARCHAR(100)    DEFAULT NULL,
            ativo             TINYINT         NOT NULL DEFAULT 1,
            ultimoPagamento   DATE            DEFAULT NULL,
            valorMensalMedio  DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
            qtdContratos      INT             NOT NULL DEFAULT 0,
            scoreEntrega      DECIMAL(4,1)    DEFAULT NULL,
            scorePontualidade DECIMAL(4,1)    DEFAULT NULL,
            scoreQualidade    DECIMAL(4,1)    DEFAULT NULL,
            createdAt         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (idFornecedor),
            UNIQUE KEY uq_fornecedor_cpfcnpj (cpfCnpj)
        ) ENGINE=InnoDB
        """
    )
    print("[OK] [STARTUP] Tabela Fornecedores verificada")
except Exception as e:
    print(f"[WARN] [STARTUP] Erro ao verificar tabela Fornecedores: {type(e).__name__}")


# ── helpers ───────────────────────────────────────────────────────────────────

def _format_item(row: dict) -> dict:
    return {
        "id": row["idFornecedor"],
        "tipo": row.get("tipo", "PJ"),
        "nome": row.get("nome") or "",
        "razaoSocial": row.get("razaoSocial") or "",
        "cpfCnpj": row.get("cpfCnpj") or "",
        "email": row.get("email") or "",
        "telefone": row.get("telefone") or "",
        "cep": row.get("cep") or "",
        "endereco": row.get("endereco") or "",
        "centroCusto": row.get("centroCusto") or "",
        "categoria": row.get("categoria") or "",
        "tipoDespesa": row.get("categoria") or "",
        "ativo": bool(row.get("ativo", 1)),
        "ultimoPagamento": str(row["ultimoPagamento"]) if row.get("ultimoPagamento") else None,
        "valorMensalMedio": float(row.get("valorMensalMedio") or 0),
        "qtdContratos": int(row.get("qtdContratos") or 0),
        "scoreEntrega": float(row["scoreEntrega"]) if row.get("scoreEntrega") is not None else 0.0,
        "scorePontualidade": float(row["scorePontualidade"]) if row.get("scorePontualidade") is not None else 0.0,
        "scoreQualidade": float(row["scoreQualidade"]) if row.get("scoreQualidade") is not None else 0.0,
    }


# ── endpoints ─────────────────────────────────────────────────────────────────

def listar_fornecedores() -> list[dict]:
    rows = execute_query("SELECT * FROM Fornecedores ORDER BY nome")
    return [_format_item(r) for r in rows]


def buscar_fornecedor(id_fornecedor: int) -> dict | None:
    rows = execute_query(
        "SELECT * FROM Fornecedores WHERE idFornecedor = %s LIMIT 1",
        (id_fornecedor,),
    )
    return _format_item(rows[0]) if rows else None


def criar_fornecedor(body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    tipo = (data.get("tipo") or "").upper()
    if tipo not in ("PF", "PJ"):
        raise ValueError("tipo deve ser 'PF' ou 'PJ'")
    if not data.get("nome"):
        raise ValueError("nome é obrigatório")
    if not data.get("cpfCnpj"):
        raise ValueError("cpfCnpj é obrigatório")

    categoria = data.get("categoria") or data.get("tipoDespesa")

    id_fornecedor = execute_write(
        """
        INSERT INTO Fornecedores
            (tipo, nome, razaoSocial, cpfCnpj, email, telefone,
             cep, endereco, centroCusto, categoria, ativo,
             ultimoPagamento, valorMensalMedio, qtdContratos,
             scoreEntrega, scorePontualidade, scoreQualidade)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            tipo,
            data["nome"],
            data.get("razaoSocial") or None,
            data["cpfCnpj"],
            data.get("email"),
            data.get("telefone"),
            data.get("cep"),
            data.get("endereco"),
            data.get("centroCusto"),
            categoria,
            1,
            data.get("ultimoPagamento") or None,
            data.get("valorMensalMedio", 0),
            data.get("qtdContratos", 0),
            data.get("scoreEntrega"),
            data.get("scorePontualidade"),
            data.get("scoreQualidade"),
        ),
    )
    return buscar_fornecedor(id_fornecedor)


def atualizar_fornecedor(id_fornecedor: int, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    if not buscar_fornecedor(id_fornecedor):
        raise ValueError(f"Fornecedor {id_fornecedor} não encontrado")

    tipo = (data.get("tipo") or "PJ").upper()
    categoria = data.get("categoria") or data.get("tipoDespesa")

    execute_write(
        """
        UPDATE Fornecedores SET
            tipo=%s, nome=%s, razaoSocial=%s, cpfCnpj=%s, email=%s, telefone=%s,
            cep=%s, endereco=%s, centroCusto=%s, categoria=%s,
            ultimoPagamento=%s, valorMensalMedio=%s, qtdContratos=%s,
            scoreEntrega=%s, scorePontualidade=%s, scoreQualidade=%s
        WHERE idFornecedor = %s
        """,
        (
            tipo,
            data.get("nome"),
            data.get("razaoSocial") or None,
            data.get("cpfCnpj"),
            data.get("email"),
            data.get("telefone"),
            data.get("cep"),
            data.get("endereco"),
            data.get("centroCusto"),
            categoria,
            data.get("ultimoPagamento") or None,
            data.get("valorMensalMedio", 0),
            data.get("qtdContratos", 0),
            data.get("scoreEntrega"),
            data.get("scorePontualidade"),
            data.get("scoreQualidade"),
            id_fornecedor,
        ),
    )
    return buscar_fornecedor(id_fornecedor)


def atualizar_status_fornecedor(id_fornecedor: int, ativo: bool) -> dict:
    if not buscar_fornecedor(id_fornecedor):
        raise ValueError(f"Fornecedor {id_fornecedor} não encontrado")
    execute_write(
        "UPDATE Fornecedores SET ativo = %s WHERE idFornecedor = %s",
        (1 if ativo else 0, id_fornecedor),
    )
    return buscar_fornecedor(id_fornecedor)


def excluir_fornecedor(id_fornecedor: int) -> dict:
    if not buscar_fornecedor(id_fornecedor):
        raise ValueError(f"Fornecedor {id_fornecedor} não encontrado")
    execute_write(
        "DELETE FROM Fornecedores WHERE idFornecedor = %s", (id_fornecedor,)
    )
    return {"deleted": id_fornecedor}


def atualizar_status_lote(ids: list[int], ativo: bool) -> dict:
    if not ids:
        return {"updated": 0}
    ph = ",".join(["%s"] * len(ids))
    execute_write(
        f"UPDATE Fornecedores SET ativo = %s WHERE idFornecedor IN ({ph})",
        (1 if ativo else 0, *ids),
    )
    return {"updated": len(ids)}


def excluir_lote(ids: list[int]) -> dict:
    if not ids:
        return {"deleted": 0}
    ph = ",".join(["%s"] * len(ids))
    execute_write(
        f"DELETE FROM Fornecedores WHERE idFornecedor IN ({ph})",
        tuple(ids),
    )
    return {"deleted": len(ids)}
