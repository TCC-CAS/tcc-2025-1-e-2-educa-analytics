"""
Serviço de autenticação com JWT simples (HMAC-SHA256).
Não requer bibliotecas externas além do Python padrão.
"""

import hashlib
import hmac
import json
import time
import base64
from app.src.core.config import Config
from app.src.models.models import UsuarioModel


def _hash_senha(senha: str) -> str:
    """SHA-256 da senha. Em produção, use bcrypt via Lambda Layer."""
    return hashlib.sha256(senha.encode()).hexdigest()


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _gerar_token(usuario: dict) -> str:
    """Gera um JWT simples HS256."""
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    agora = int(time.time())
    payload = _b64url(
        json.dumps(
            {
                "sub": usuario["id"],
                "email": usuario["email"],
                "perfil": usuario["perfil"],
                "iat": agora,
                "exp": agora + Config.JWT_EXPIRATION_HOURS * 3600,
            }
        ).encode()
    )
    assinatura = _b64url(
        hmac.new(
            Config.JWT_SECRET.encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256,
        ).digest()
    )
    return f"{header}.{payload}.{assinatura}"


def validar_token(token: str) -> dict | None:
    """Valida o JWT e retorna o payload ou None se inválido/expirado."""
    try:
        partes = token.split(".")
        if len(partes) != 3:
            return None
        header, payload, assinatura = partes
        assinatura_esperada = _b64url(
            hmac.new(
                Config.JWT_SECRET.encode(),
                f"{header}.{payload}".encode(),
                hashlib.sha256,
            ).digest()
        )
        if not hmac.compare_digest(assinatura, assinatura_esperada):
            return None
        padding = 4 - len(payload) % 4
        dados = json.loads(base64.urlsafe_b64decode(payload + "=" * padding))
        if dados.get("exp", 0) < int(time.time()):
            return None
        return dados
    except Exception:
        return None


def login(email: str, senha: str) -> dict | None:
    """
    Autentica o usuário e retorna token + dados.
    Retorna None se as credenciais forem inválidas.
    """
    usuario = UsuarioModel.find_by_email(email)
    if not usuario:
        return None
    if usuario["senha_hash"] != _hash_senha(senha):
        return None
    token = _gerar_token(usuario)
    return {
        "token": token,
        "usuario": {
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "perfil": usuario["perfil"],
        },
    }


def registrar(nome: str, email: str, senha: str, perfil: str = "professor") -> int:
    """Cria um novo usuário. Retorna o ID gerado."""
    if UsuarioModel.find_by_email(email):
        raise ValueError("E-mail já cadastrado")
    return UsuarioModel.create(nome, email, _hash_senha(senha), perfil)


def get_usuario_do_evento(event: dict) -> dict | None:
    """Extrai e valida o token do header Authorization do evento Lambda."""
    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    return validar_token(token)
