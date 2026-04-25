"""
Adaptador de banco de dados usando PyMySQL.

PyMySQL é puro Python — não precisa de drivers binários,
funciona no AWS Lambda sem nenhuma configuração extra de Layer.

Instalar: pip install PyMySQL
"""

from __future__ import annotations

import pymysql
import pymysql.cursors
from app.src.core.config import Config


# Conexão reutilizada entre invocações do Lambda (connection reuse)
_connection: pymysql.Connection | None = None


def get_connection() -> pymysql.Connection:
    """
    Retorna uma conexão ativa ao MySQL.
    Reutiliza a conexão entre invocações Lambda quando possível (warm start).
    """
    global _connection

    try:
        if _connection and _connection.open:
            _connection.ping(reconnect=True)
            return _connection
    except Exception:
        _connection = None

    _connection = pymysql.connect(
        host=Config.DB_HOST(),
        port=Config.DB_PORT(),
        user=Config.DB_USER(),
        password=Config.DB_PASSWORD(),
        database=Config.DB_NAME(),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
        autocommit=False,
    )

    return _connection


def execute_query(sql: str, params: tuple = ()) -> list[dict]:
    """Executa um SELECT e retorna lista de dicionários."""
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchall()


def execute_write(sql: str, params: tuple = ()) -> int:
    """
    Executa INSERT / UPDATE / DELETE.
    Retorna o ID gerado (lastrowid) ou número de linhas afetadas.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
        conn.commit()
        return cursor.lastrowid or cursor.rowcount
    except Exception:
        conn.rollback()
        raise


def execute_transaction(steps: list[tuple[str, tuple]]) -> list[int]:
    """
    Executa uma lista de (sql, params) dentro de uma única transação atômica.
    Retorna lista com o lastrowid/rowcount de cada step.
    Faz rollback completo se qualquer step falhar.
    """
    conn = get_connection()
    results: list[int] = []
    try:
        with conn.cursor() as cursor:
            for sql, params in steps:
                cursor.execute(sql, params)
                results.append(cursor.lastrowid or cursor.rowcount)
        conn.commit()
        return results
    except Exception:
        conn.rollback()
        raise
