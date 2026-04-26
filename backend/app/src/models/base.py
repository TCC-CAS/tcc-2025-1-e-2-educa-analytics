"""
Modelo base com métodos auxiliares para busca e escrita no MySQL.
"""
from __future__ import annotations

from app.src.adapters.db_adapter import execute_query, execute_write


class BaseModel:
    TABLE: str = ""

    @classmethod
    def find_all(cls) -> list[dict]:
        return execute_query(f"SELECT * FROM {cls.TABLE}")

    @classmethod
    def find_by_id(cls, record_id: int) -> dict | None:
        rows = execute_query(f"SELECT * FROM {cls.TABLE} WHERE id = %s", (record_id,))
        return rows[0] if rows else None

    @classmethod
    def find_by(cls, field: str, value) -> list[dict]:
        return execute_query(f"SELECT * FROM {cls.TABLE} WHERE {field} = %s", (value,))

    @classmethod
    def delete(cls, record_id: int) -> int:
        return execute_write(f"DELETE FROM {cls.TABLE} WHERE id = %s", (record_id,))
