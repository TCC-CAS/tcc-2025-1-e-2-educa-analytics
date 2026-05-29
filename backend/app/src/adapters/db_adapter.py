"""
Adaptador de banco de dados usando PyMySQL.

PyMySQL é puro Python — não precisa de drivers binários,
funciona no AWS Lambda sem nenhuma configuração extra de Layer.

Instalar: pip install PyMySQL
"""

from __future__ import annotations

import pymysql
import pymysql.cursors
from contextlib import contextmanager
from app.src.core.config import Config


# Conexão reutilizada entre invocações do Lambda (connection reuse)
_connection: pymysql.Connection | None = None


def _create_connection() -> pymysql.Connection:
    """Cria uma nova conexão com o banco de dados."""
    conn = pymysql.connect(
        host=Config.DB_HOST(),
        port=Config.DB_PORT(),
        user=Config.DB_USER(),
        password=Config.DB_PASSWORD(),
        database=Config.DB_NAME(),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
        read_timeout=30,
        write_timeout=30,
        autocommit=False,
    )
    
    # FORÇAR o database correto
    with conn.cursor() as cur:
        cur.execute(f"USE `{Config.DB_NAME()}`")
    
    return conn


@contextmanager
def get_connection():
    """
    Context manager que retorna uma conexão e a fecha automaticamente.
    Para servidor local: cria nova conexão a cada vez (evita pool esgotado).
    Para Lambda: poderia reutilizar (mas por segurança, cria nova).
    """
    conn = _create_connection()
    try:
        yield conn
    finally:
        if conn and conn.open:
            conn.close()


def execute_query(sql: str, params: tuple = ()) -> list[dict]:
    """Executa um SELECT e retorna lista de dicionários."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # DEBUG: Verificar banco atual
            cursor.execute("SELECT DATABASE()")
            current_db = cursor.fetchone()
            print(f"[DEBUG execute_query] Database atual: {current_db}")
            print(f"[DEBUG execute_query] SQL: {sql[:100]}...")
            
            cursor.execute(sql, params)
            result = cursor.fetchall()
            print(f"[DEBUG execute_query] Resultado: {len(result)} registros")
            
            # DEBUG: Ver primeiras 3 linhas
            if result:
                print(f"[DEBUG] Primeira linha completa: {result[0]}")
                if 'codTurma' in result[0]:
                    print(f"[DEBUG] codTurma da primeira linha: [{result[0]['codTurma']}]")
            
            return result


def execute_write(sql: str, params: tuple = ()) -> int:
    """
    Executa INSERT / UPDATE / DELETE.
    Retorna o ID gerado (lastrowid) ou número de linhas afetadas.
    """
    with get_connection() as conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                last_id = cursor.lastrowid or cursor.rowcount
            conn.commit()
            return last_id
        except Exception:
            conn.rollback()
            raise


def execute_transaction(steps: list[tuple[str, tuple]]) -> list[int]:
    """
    Executa uma lista de (sql, params) dentro de uma única transação atômica.
    Retorna lista com o lastrowid/rowcount de cada step.
    Faz rollback completo se qualquer step falhar.
    """
    with get_connection() as conn:
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
