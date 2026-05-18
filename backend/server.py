"""
Servidor de desenvolvimento local — emula o API Gateway para testar o
frontend sem precisar fazer deploy na AWS.

Uso:
    python server.py

A API fica disponível em http://localhost:3000/api
"""

import json
import os
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote_plus
from dotenv import load_dotenv

# Garante que o .env seja carregado da pasta backend
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path, override=True)

# Debug: mostrar configuração do banco
print(f"\n🔧 Configuração do Banco de Dados:")
print(f"   DB_HOST: {os.environ.get('DB_HOST', 'NOT SET')}")
print(f"   DB_PORT: {os.environ.get('DB_PORT', 'NOT SET')}")
print(f"   DB_USER: {os.environ.get('DB_USER', 'NOT SET')}")
print(f"   DB_NAME: {os.environ.get('DB_NAME', 'NOT SET')}")
print()

# Importa o router após carregar o .env
import lambda_function  # noqa: E402 — registra todas as rotas via decorators

# Debug: Print registered routes
print("\n=== Rotas Registradas ===")
for method, path, handler in lambda_function.router._routes:
    print(f"{method:6} {path:40} -> {handler.__name__}")
print("=" * 60 + "\n")

HOST = "localhost"
PORT = 3000
API_PREFIX = "/api"


class LambdaHandler(BaseHTTPRequestHandler):

    def _build_event(self, body: bytes = b"") -> dict:
        """Monta um evento no formato API Gateway a partir da requisição HTTP."""
        path = self.path
        query_string = ""
        query_params = {}

        if "?" in path:
            path, query_string = path.split("?", 1)
            parsed = parse_qs(query_string, keep_blank_values=True)
            # parse_qs retorna listas; pega o primeiro valor de cada chave
            query_params = {k: v[0] for k, v in parsed.items()}

        # Remove o prefixo /api da rota
        api_path = path[len(API_PREFIX):] if path.startswith(API_PREFIX) else path
        if not api_path:
            api_path = "/"

        return {
            "httpMethod": self.command,
            "path": api_path,
            "headers": dict(self.headers),
            "queryStringParameters": query_params or None,
            "body": body.decode("utf-8", errors='replace') if body else None,
        }

    def _handle(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""

        event = self._build_event(body)
        response = lambda_function.router.dispatch(event)

        status_code = response.get("statusCode", 200)
        response_body = response.get("body", "")
        headers = response.get("headers", {})

        self.send_response(status_code)

        # CORS — permite qualquer origem em desenvolvimento
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Type", "application/json; charset=utf-8")

        for key, value in headers.items():
            if key.lower() not in ("content-type", "access-control-allow-origin"):
                self.send_header(key, value)

        self.end_headers()
        self.wfile.write(response_body.encode("utf-8"))

    def do_GET(self):    self._handle()
    def do_POST(self):   self._handle()
    def do_PUT(self):    self._handle()
    def do_PATCH(self):  self._handle()
    def do_DELETE(self): self._handle()
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"  {self.command} {self.path}  →  {args[1]}")


if __name__ == "__main__":
    print(f"educaAnalytics API rodando em http://{HOST}:{PORT}{API_PREFIX}")
    print("Pressione Ctrl+C para parar.\n")
    server = HTTPServer((HOST, PORT), LambdaHandler)
    server.serve_forever()
