"""
Serviço de autenticação OAuth (Google e Microsoft).
Permite login social e vinculação de contas.
"""
from typing import Dict, Optional
import urllib.request
import urllib.parse
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from app.src.adapters.db_adapter import execute_query, execute_write
from app.src.services import auth_service
from app.src.models.models import LoginModel
from app.src.core.config import Config


# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO OAUTH  (lida das env vars via Config)
# ══════════════════════════════════════════════════════════════════════════════

def _google_client_id():     return Config.GOOGLE_CLIENT_ID()
def _google_client_secret(): return Config.GOOGLE_CLIENT_SECRET()
def _google_redirect_uri():  return Config.GOOGLE_REDIRECT_URI()

def _microsoft_client_id():     return Config.MICROSOFT_CLIENT_ID()
def _microsoft_client_secret(): return Config.MICROSOFT_CLIENT_SECRET()
def _microsoft_redirect_uri():  return Config.MICROSOFT_REDIRECT_URI()

GOOGLE_AUTH_URL     = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL    = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

MICROSOFT_AUTH_URL     = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
MICROSOFT_TOKEN_URL    = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
MICROSOFT_USERINFO_URL = "https://graph.microsoft.com/v1.0/me"


# ══════════════════════════════════════════════════════════════════════════════
# GOOGLE OAUTH
# ══════════════════════════════════════════════════════════════════════════════

def gerar_url_google() -> Dict[str, str]:
    """
    Gera URL de autenticação Google OAuth.
    
    Returns:
        {"url": "https://accounts.google.com/o/oauth2/...", "state": "random_token"}
    """
    # Gerar state aleatório para CSRF protection
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": _google_client_id(),
        "redirect_uri": _google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    
    return {
        "url": url,
        "state": state
    }


def autenticar_google(code: str, state: str = None) -> Dict:
    """
    Autentica usuário via Google OAuth.
    
    Args:
        code: Authorization code retornado pelo Google
        state: State token para validação CSRF
    
    Returns:
        {
            "token": "JWT_TOKEN",
            "usuario": {...},
            "nova_conta": bool  # True se conta foi criada
        }
    """
    try:
        # 1. Trocar code por access_token
        token_data = _trocar_code_por_token_google(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise ValueError("Falha ao obter access token do Google")
        
        # 2. Buscar informações do usuário
        user_info = _buscar_user_info_google(access_token)
        
        email = user_info.get("email")
        nome = user_info.get("name")
        google_id = user_info.get("id")
        
        if not email:
            raise ValueError("Email não fornecido pelo Google")
        
        # 3. Buscar ou criar conta local
        resultado = _buscar_ou_criar_conta_oauth(
            email=email,
            nome=nome,
            provider="google",
            provider_id=google_id
        )
        
        return resultado
    
    except Exception as e:
        print(f"[oauth] Erro na autenticação Google: {e}")
        raise ValueError(f"Erro na autenticação Google: {str(e)}")


def _trocar_code_por_token_google(code: str) -> Dict:
    """Troca authorization code por access token"""
    data = {
        "code": code,
        "client_id": _google_client_id(),
        "client_secret": _google_client_secret(),
        "redirect_uri": _google_redirect_uri(),
        "grant_type": "authorization_code"
    }
    
    req = urllib.request.Request(
        GOOGLE_TOKEN_URL,
        data=urllib.parse.urlencode(data).encode(),
        method="POST"
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


def _buscar_user_info_google(access_token: str) -> Dict:
    """Busca informações do usuário no Google"""
    req = urllib.request.Request(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


# ══════════════════════════════════════════════════════════════════════════════
# MICROSOFT OAUTH
# ══════════════════════════════════════════════════════════════════════════════

def gerar_url_microsoft() -> Dict[str, str]:
    """
    Gera URL de autenticação Microsoft OAuth.
    
    Returns:
        {"url": "https://login.microsoftonline.com/...", "state": "random_token"}
    """
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": _microsoft_client_id(),
        "redirect_uri": _microsoft_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "response_mode": "query"
    }
    
    url = f"{MICROSOFT_AUTH_URL}?{urllib.parse.urlencode(params)}"
    
    return {
        "url": url,
        "state": state
    }


def autenticar_microsoft(code: str, state: str = None) -> Dict:
    """
    Autentica usuário via Microsoft OAuth.
    
    Args:
        code: Authorization code retornado pela Microsoft
        state: State token para validação CSRF
    
    Returns:
        {
            "token": "JWT_TOKEN",
            "usuario": {...},
            "nova_conta": bool
        }
    """
    try:
        # 1. Trocar code por access_token
        token_data = _trocar_code_por_token_microsoft(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise ValueError("Falha ao obter access token da Microsoft")
        
        # 2. Buscar informações do usuário
        user_info = _buscar_user_info_microsoft(access_token)
        
        email = user_info.get("mail") or user_info.get("userPrincipalName")
        nome = user_info.get("displayName")
        microsoft_id = user_info.get("id")
        
        if not email:
            raise ValueError("Email não fornecido pela Microsoft")
        
        # 3. Buscar ou criar conta local
        resultado = _buscar_ou_criar_conta_oauth(
            email=email,
            nome=nome,
            provider="microsoft",
            provider_id=microsoft_id
        )
        
        return resultado
    
    except Exception as e:
        print(f"[oauth] Erro na autenticação Microsoft: {e}")
        raise ValueError(f"Erro na autenticação Microsoft: {str(e)}")


def _trocar_code_por_token_microsoft(code: str) -> Dict:
    """Troca authorization code por access token"""
    data = {
        "code": code,
        "client_id": _microsoft_client_id(),
        "client_secret": _microsoft_client_secret(),
        "redirect_uri": _microsoft_redirect_uri(),
        "grant_type": "authorization_code"
    }
    
    req = urllib.request.Request(
        MICROSOFT_TOKEN_URL,
        data=urllib.parse.urlencode(data).encode(),
        method="POST"
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


def _buscar_user_info_microsoft(access_token: str) -> Dict:
    """Busca informações do usuário na Microsoft"""
    req = urllib.request.Request(
        MICROSOFT_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


# ══════════════════════════════════════════════════════════════════════════════
# LÓGICA COMUM OAUTH
# ══════════════════════════════════════════════════════════════════════════════

def _buscar_ou_criar_conta_oauth(
    email: str,
    nome: str,
    provider: str,
    provider_id: str
) -> Dict:
    """
    Busca conta existente ou cria nova conta via OAuth.
    
    Args:
        email: Email do usuário
        nome: Nome completo
        provider: "google" ou "microsoft"
        provider_id: ID único do provider
    
    Returns:
        {
            "token": "JWT_TOKEN",
            "usuario": {...},
            "nova_conta": bool
        }
    """
    # 1. Verificar se já existe conta com este email
    login_records = LoginModel.find_by_email_or_id(email)
    
    nova_conta = False
    id_matricula = None
    tipo_usuario = None
    
    if login_records:
        # Conta já existe - fazer login
        login_data = login_records[0]
        id_matricula = login_data.get("idMatricula")
        
        # Determinar tipo de usuário
        from app.src.services.auth_service import _buscar_dados_usuario
        tipo_usuario, usuario_data = _buscar_dados_usuario(id_matricula)
        
        if not usuario_data:
            raise ValueError("Dados do usuário não encontrados")
        
        # Atualizar vinculação OAuth se ainda não existe
        _vincular_oauth_provider(id_matricula, provider, provider_id)
        
    else:
        # Criar nova conta como Colaborador (ou tipo padrão)
        # Em produção, pode exigir pré-cadastro ou approval
        nova_conta = True
        
        # Gerar ID de matrícula
        from app.src.services.colaborador_service import gerar_proximo_id_colaborador
        id_matricula = gerar_proximo_id_colaborador()
        
        # Criar registro de Colaborador
        execute_write(
            """
            INSERT INTO Colaborador 
            (idMatricula, nomeCompleto, email, funcao, dataAdmissao, idStatus)
            VALUES (%s, %s, %s, %s, NOW(), 1)
            """,
            (id_matricula, nome, email, "Usuário OAuth")
        )
        
        # Criar registro de Login (senha NULL para OAuth)
        senha_aleatoria = hashlib.sha256(secrets.token_bytes(32)).hexdigest()
        execute_write(
            """
            INSERT INTO Login 
            (idMatricula, email, senha, senha_definida)
            VALUES (%s, %s, %s, 0)
            """,
            (id_matricula, email, senha_aleatoria)
        )
        
        # Vincular OAuth
        _vincular_oauth_provider(id_matricula, provider, provider_id)
        
        tipo_usuario = "colaborador"
        usuario_data = {
            "nomeCompleto": nome,
            "email": email
        }
    
    # 2. Gerar token JWT
    from app.src.services.auth_service import _gerar_token
    usuario = {
        "id": id_matricula,
        "nome": usuario_data.get("nomeCompleto", nome),
        "email": email,
        "perfil": tipo_usuario,
    }
    
    token = _gerar_token(usuario)
    
    # 3. Criar sessão
    from app.src.services import sessao_service
    sessao_service.criar_sessao(
        id_matricula=id_matricula,
        token_jwt=token,
        ip_address="OAuth",
        user_agent=f"OAuth {provider}"
    )
    
    # 4. Registrar auditoria
    from app.src.services import auditoria_service
    auditoria_service.registrar_evento(
        tipo_evento="login_sucesso_oauth",
        id_matricula=id_matricula,
        email=email,
        sucesso=True,
        detalhes=f"Login via {provider}" + (" - Nova conta criada" if nova_conta else "")
    )
    
    return {
        "token": token,
        "usuario": usuario,
        "nova_conta": nova_conta
    }


def _vincular_oauth_provider(id_matricula: str, provider: str, provider_id: str):
    """
    Vincula conta OAuth ao usuário.
    Cria tabela oauth_providers se não existir.
    """
    try:
        # Verificar se vinculação já existe
        result = execute_query(
            """
            SELECT id FROM oauth_providers 
            WHERE id_matricula = %s AND provider = %s
            """,
            (id_matricula, provider)
        )
        
        if not result:
            # Criar vinculação
            execute_write(
                """
                INSERT INTO oauth_providers 
                (id_matricula, provider, provider_id, vinculado_em)
                VALUES (%s, %s, %s, NOW())
                """,
                (id_matricula, provider, provider_id)
            )
            print(f"[oauth] Vinculado {provider} para {id_matricula}")
    
    except Exception as e:
        # Se tabela não existe, criar
        if "doesn't exist" in str(e).lower():
            _criar_tabela_oauth_providers()
            # Tentar novamente
            _vincular_oauth_provider(id_matricula, provider, provider_id)
        else:
            print(f"[oauth] Erro ao vincular provider: {e}")


def _criar_tabela_oauth_providers():
    """Cria tabela para armazenar vinculações OAuth"""
    execute_write("""
        CREATE TABLE IF NOT EXISTS oauth_providers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_matricula VARCHAR(50) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            provider_id VARCHAR(255) NOT NULL,
            vinculado_em DATETIME NOT NULL,
            UNIQUE KEY uq_user_provider (id_matricula, provider),
            FOREIGN KEY (id_matricula) REFERENCES Login(idMatricula) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("[oauth] Tabela oauth_providers criada")
