"""
Roteador HTTP simples para AWS Lambda + API Gateway.

Uso:
    from app.src.utils.router import Router
    router = Router()

    @router.route("GET", "/alunos")
    def listar_alunos(event):
        ...

    def lambda_handler(event, context):
        return router.dispatch(event)
"""

import re
from app.src.utils.response import not_found, server_error


class Router:
    def __init__(self):
        self._routes: list[tuple[str, str, callable]] = []

    def route(self, method: str, path: str):
        """Decorator para registrar uma rota."""
        def decorator(func: callable):
            self._routes.append((method.upper(), path, func))
            return func
        return decorator

    def dispatch(self, event: dict) -> dict:
        """Encontra e executa o handler correspondente ao evento."""
        method = event.get("httpMethod") or event.get("requestContext", {}).get(
            "http", {}
        ).get("method", "GET")
        path = event.get("path") or event.get("rawPath", "/")

        # Pré-flight CORS
        if method == "OPTIONS":
            from app.src.utils.response import ok
            return ok({})

        for route_method, route_path, handler in self._routes:
            if route_method != method:
                continue
            # Suporte a path params: /alunos/{id}
            pattern = re.sub(r"\{(\w+)\}", r"(?P<\1>[^/]+)", route_path)
            match = re.fullmatch(pattern, path)
            if match:
                event["pathParameters"] = {
                    **(event.get("pathParameters") or {}),
                    **match.groupdict(),
                }
                try:
                    return handler(event)
                except Exception as exc:
                    print(f"[Router] Erro em {route_method} {path}: {exc}")
                    return server_error(str(exc))

        return not_found(f"Rota não encontrada: {method} {path}")
