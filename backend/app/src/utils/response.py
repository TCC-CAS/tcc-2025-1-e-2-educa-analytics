"""
Utilitários para montar respostas HTTP no padrão do API Gateway.
"""

import json
from app.src.core.config import Config


def _headers() -> dict:
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": Config.ALLOWED_ORIGINS,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }


def ok(data: any, status_code: int = 200) -> dict:
    """Resposta de sucesso."""
    return {
        "statusCode": status_code,
        "headers": _headers(),
        "body": json.dumps(data, default=str, ensure_ascii=False),
    }


def created(data: any) -> dict:
    """Resposta 201 Created."""
    return ok(data, status_code=201)


def error(message: str, status_code: int = 400) -> dict:
    """Resposta de erro com mensagem."""
    return {
        "statusCode": status_code,
        "headers": _headers(),
        "body": json.dumps({"error": message}, ensure_ascii=False),
    }


def not_found(message: str = "Recurso não encontrado") -> dict:
    return error(message, status_code=404)


def unauthorized(message: str = "Não autorizado") -> dict:
    return error(message, status_code=401)


def server_error(message: str = "Erro interno do servidor") -> dict:
    return error(message, status_code=500)
