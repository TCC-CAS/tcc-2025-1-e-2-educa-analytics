"""
Middleware de segurança: CSP Headers, CSRF Token, etc.
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.src.adapters.db_adapter import execute_query, execute_write


# ══════════════════════════════════════════════════════════════════════════════
# CSP (Content Security Policy) HEADERS
# ══════════════════════════════════════════════════════════════════════════════

def obter_security_headers() -> Dict[str, str]:
    """
    Retorna headers de segurança para todas as respostas.
    
    Returns:
        Dict de headers HTTP
    """
    return {
        # Content Security Policy - Previne XSS
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' https://www.google.com https://www.gstatic.com; "  # reCAPTCHA
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://www.google.com; "
            "frame-src 'self' https://www.google.com; "  # reCAPTCHA
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests;"
        ),
        
        # X-Frame-Options - Previne Clickjacking
        "X-Frame-Options": "DENY",
        
        # X-Content-Type-Options - Previne MIME sniffing
        "X-Content-Type-Options": "nosniff",
        
        # Referrer-Policy - Controla informações de referrer
        "Referrer-Policy": "strict-origin-when-cross-origin",
        
        # X-XSS-Protection - Proteção XSS legada (navegadores antigos)
        "X-XSS-Protection": "1; mode=block",
        
        # Permissions-Policy - Controla features do navegador
        "Permissions-Policy": (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=()"
        ),
        
        # Strict-Transport-Security - Força HTTPS (apenas em produção)
        # "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    }


def aplicar_security_headers(response: Dict) -> Dict:
    """
    Adiciona headers de segurança a uma resposta.
    
    Args:
        response: Response dict com statusCode, headers, body
    
    Returns:
        Response com headers de segurança
    """
    if "headers" not in response:
        response["headers"] = {}
    
    security_headers = obter_security_headers()
    response["headers"].update(security_headers)
    
    return response


# ══════════════════════════════════════════════════════════════════════════════
# CSRF TOKEN
# ══════════════════════════════════════════════════════════════════════════════

def gerar_csrf_token(id_matricula: str) -> str:
    """
    Gera token CSRF único para o usuário.
    
    Args:
        id_matricula: ID do usuário
    
    Returns:
        Token CSRF (hex string)
    """
    # Gerar token aleatório
    random_token = secrets.token_hex(32)
    
    # Criar hash combinando token + user ID
    combined = f"{random_token}:{id_matricula}"
    csrf_token = hashlib.sha256(combined.encode()).hexdigest()
    
    # Salvar no banco com expiração
    try:
        execute_write(
            """
            INSERT INTO csrf_tokens (id_matricula, token, expira_em)
            VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 1 HOUR))
            ON DUPLICATE KEY UPDATE 
                token = VALUES(token),
                expira_em = VALUES(expira_em)
            """,
            (id_matricula, csrf_token)
        )
    except Exception as e:
        # Se tabela não existe, criar
        if "doesn't exist" in str(e).lower():
            _criar_tabela_csrf_tokens()
            return gerar_csrf_token(id_matricula)  # Tentar novamente
        raise
    
    return csrf_token


def validar_csrf_token(id_matricula: str, token: str) -> bool:
    """
    Valida token CSRF.
    
    Args:
        id_matricula: ID do usuário
        token: Token CSRF recebido
    
    Returns:
        True se token é válido e não expirou
    """
    try:
        result = execute_query(
            """
            SELECT COUNT(*) as cnt 
            FROM csrf_tokens 
            WHERE id_matricula = %s 
              AND token = %s 
              AND expira_em > NOW()
            """,
            (id_matricula, token)
        )
        
        return result[0]["cnt"] > 0 if result else False
    
    except Exception as e:
        print(f"[csrf] Erro ao validar token: {e}")
        return False


def invalidar_csrf_token(id_matricula: str):
    """Remove token CSRF do usuário"""
    try:
        execute_write(
            "DELETE FROM csrf_tokens WHERE id_matricula = %s",
            (id_matricula,)
        )
    except Exception as e:
        print(f"[csrf] Erro ao invalidar token: {e}")


def _criar_tabela_csrf_tokens():
    """Cria tabela para armazenar tokens CSRF"""
    execute_write("""
        CREATE TABLE IF NOT EXISTS csrf_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_matricula VARCHAR(50) NOT NULL UNIQUE,
            token VARCHAR(64) NOT NULL,
            expira_em DATETIME NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_expiracao (expira_em),
            FOREIGN KEY (id_matricula) REFERENCES Login(idMatricula) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("[csrf] Tabela csrf_tokens criada")


# ══════════════════════════════════════════════════════════════════════════════
# LIMPEZA PERIÓDICA
# ══════════════════════════════════════════════════════════════════════════════

def limpar_tokens_expirados():
    """Remove tokens CSRF expirados (executar via cron)"""
    try:
        execute_write("DELETE FROM csrf_tokens WHERE expira_em < NOW()")
        print("[csrf] Tokens expirados removidos")
    except Exception as e:
        print(f"[csrf] Erro ao limpar tokens: {e}")
