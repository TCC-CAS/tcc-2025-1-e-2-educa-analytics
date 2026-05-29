"""
Utilitários para montar respostas HTTP no padrão do API Gateway.
Inclui headers de segurança em todas as respostas.
"""

import json
from app.src.core.config import Config


def _headers() -> dict:
    """Retorna headers HTTP com segurança"""
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": Config.ALLOWED_ORIGINS,
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-CSRF-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }
    
    # Adicionar headers de segurança
    try:
        from app.src.services.security_middleware import obter_security_headers
        security_headers = obter_security_headers()
        headers.update(security_headers)
    except ImportError:
        pass  # security_middleware ainda não carregado
    
    return headers


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
