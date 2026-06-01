"""
Serviço de gerenciamento de sessões ativas.
Permite listar dispositivos conectados e encerrar sessões remotamente.
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import hashlib
from app.src.adapters.db_adapter import execute_query, execute_write


def criar_sessao(
    id_matricula: str,
    token_jwt: str,
    ip_address: str = None,
    user_agent: str = None
) -> str:
    """
    Cria uma nova sessão ativa quando o usuário faz login.
    
    Args:
        id_matricula: ID do usuário
        token_jwt: Token JWT gerado
        ip_address: IP do cliente
        user_agent: User-Agent do navegador
    
    Returns:
        ID da sessão criada
    """
    # Extrair informações do user_agent
    navegador = None
    dispositivo = None
    
    if user_agent:
        ua_lower = user_agent.lower()
        
        # Detectar navegador
        if 'chrome' in ua_lower and 'edg' not in ua_lower:
            navegador = 'Chrome'
        elif 'firefox' in ua_lower:
            navegador = 'Firefox'
        elif 'safari' in ua_lower and 'chrome' not in ua_lower:
            navegador = 'Safari'
        elif 'edg' in ua_lower:
            navegador = 'Edge'
        elif 'opera' in ua_lower or 'opr' in ua_lower:
            navegador = 'Opera'
        else:
            navegador = 'Outro'
        
        # Detectar dispositivo/SO
        if 'windows' in ua_lower:
            dispositivo = 'Windows'
        elif 'mac' in ua_lower and 'iphone' not in ua_lower and 'ipad' not in ua_lower:
            dispositivo = 'macOS'
        elif 'linux' in ua_lower and 'android' not in ua_lower:
            dispositivo = 'Linux'
        elif 'android' in ua_lower:
            dispositivo = 'Android'
        elif 'iphone' in ua_lower or 'ipad' in ua_lower:
            dispositivo = 'iOS'
        else:
            dispositivo = 'Outro'
    
    # Criar hash do token para identificação (não salvar token completo)
    token_hash = hashlib.sha256(token_jwt.encode()).hexdigest()
    
    # Expiração da sessão (7 dias)
    expira_em = datetime.utcnow() + timedelta(days=7)
    
    try:
        execute_write(
            """
            INSERT INTO sessoes_ativas 
            (id_matricula, token_hash, ip_address, navegador, dispositivo, expira_em)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (id_matricula, token_hash, ip_address, navegador, dispositivo, expira_em)
        )
        
        # Buscar ID da sessão criada
        result = execute_query(
            "SELECT LAST_INSERT_ID() as id_sessao"
        )
        
        id_sessao = str(result[0]['id_sessao']) if result else None
        print(f"[sessao] Sessão criada: {id_sessao} | {id_matricula} | {dispositivo}/{navegador}")
        
        return id_sessao
    
    except Exception as e:
        print(f"[sessao] Erro ao criar sessão: {e}")
        return None


def listar_sessoes_usuario(id_matricula: str) -> List[Dict]:
    """
    Lista todas as sessões ativas de um usuário.
    Usado para mostrar dispositivos conectados.
    
    Args:
        id_matricula: ID do usuário
    
    Returns:
        Lista de sessões ativas com informações de dispositivo
    """
    try:
        sessoes = execute_query(
            """
            SELECT 
                id_sessao,
                ip_address,
                navegador,
                dispositivo,
                DATE_FORMAT(criado_em, '%%d/%%m/%%Y %%H:%%i') as data_login,
                DATE_FORMAT(ultimo_acesso, '%%d/%%m/%%Y %%H:%%i') as ultimo_uso,
                DATE_FORMAT(expira_em, '%%d/%%m/%%Y %%H:%%i') as expira_em,
                ativo
            FROM sessoes_ativas
            WHERE id_matricula = %s 
              AND ativo = 1
              AND expira_em > NOW()
            ORDER BY ultimo_acesso DESC
            """,
            (id_matricula,)
        )
        
        return sessoes or []
    
    except Exception as e:
        print(f"[sessao] Erro ao listar sessões: {e}")
        return []


def atualizar_ultimo_acesso(token_jwt: str):
    """
    Atualiza o timestamp de último acesso da sessão.
    Deve ser chamado em cada requisição autenticada.
    
    Args:
        token_jwt: Token JWT da requisição
    """
    token_hash = hashlib.sha256(token_jwt.encode()).hexdigest()
    
    try:
        execute_write(
            """
            UPDATE sessoes_ativas 
            SET ultimo_acesso = NOW()
            WHERE token_hash = %s AND ativo = 1
            """,
            (token_hash,)
        )
    except Exception as e:
        print(f"[sessao] Erro ao atualizar último acesso: {e}")


def encerrar_sessao(id_matricula: str, id_sessao: str) -> bool:
    """
    Encerra uma sessão específica.
    Usuário pode encerrar sessões de outros dispositivos.
    
    Args:
        id_matricula: ID do usuário (validação de proprietário)
        id_sessao: ID da sessão a encerrar
    
    Returns:
        True se sessão foi encerrada com sucesso
    """
    try:
        # Verificar se a sessão pertence ao usuário
        result = execute_query(
            """
            SELECT id_sessao 
            FROM sessoes_ativas 
            WHERE id_sessao = %s AND id_matricula = %s
            """,
            (id_sessao, id_matricula)
        )
        
        if not result:
            print(f"[sessao] Sessão {id_sessao} não encontrada ou não pertence ao usuário")
            return False
        
        # Encerrar sessão
        execute_write(
            """
            UPDATE sessoes_ativas 
            SET ativo = 0, encerrado_em = NOW()
            WHERE id_sessao = %s
            """,
            (id_sessao,)
        )
        
        print(f"[sessao] Sessão {id_sessao} encerrada por {id_matricula}")
        return True
    
    except Exception as e:
        print(f"[sessao] Erro ao encerrar sessão: {e}")
        return False


def encerrar_todas_sessoes(id_matricula: str, exceto_token: str = None) -> int:
    """
    Encerra todas as sessões do usuário, exceto a atual (opcional).
    Útil para "Desconectar de todos os dispositivos".
    
    Args:
        id_matricula: ID do usuário
        exceto_token: Token JWT da sessão atual (não encerrar)
    
    Returns:
        Número de sessões encerradas
    """
    try:
        if exceto_token:
            token_hash = hashlib.sha256(exceto_token.encode()).hexdigest()
            
            execute_write(
                """
                UPDATE sessoes_ativas 
                SET ativo = 0, encerrado_em = NOW()
                WHERE id_matricula = %s 
                  AND token_hash != %s 
                  AND ativo = 1
                """,
                (id_matricula, token_hash)
            )
        else:
            execute_write(
                """
                UPDATE sessoes_ativas 
                SET ativo = 0, encerrado_em = NOW()
                WHERE id_matricula = %s AND ativo = 1
                """,
                (id_matricula,)
            )
        
        # Contar sessões encerradas
        result = execute_query(
            """
            SELECT COUNT(*) as total 
            FROM sessoes_ativas 
            WHERE id_matricula = %s 
              AND encerrado_em >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
            """,
            (id_matricula,)
        )
        
        total = result[0]['total'] if result else 0
        print(f"[sessao] {total} sessões encerradas para {id_matricula}")
        
        return total
    
    except Exception as e:
        print(f"[sessao] Erro ao encerrar todas as sessões: {e}")
        return 0


def validar_sessao_ativa(token_jwt: str) -> bool:
    """
    Verifica se a sessão ainda está ativa.
    
    Args:
        token_jwt: Token JWT da requisição
    
    Returns:
        True se sessão está ativa
    """
    token_hash = hashlib.sha256(token_jwt.encode()).hexdigest()
    
    try:
        result = execute_query(
            """
            SELECT id_sessao 
            FROM sessoes_ativas 
            WHERE token_hash = %s 
              AND ativo = 1 
              AND expira_em > NOW()
            """,
            (token_hash,)
        )
        
        return len(result) > 0
    
    except Exception as e:
        print(f"[sessao] Erro ao validar sessão: {e}")
        return False


def limpar_sessoes_expiradas() -> int:
    """
    Remove sessões expiradas do banco.
    Deve ser executado periodicamente (cron job).
    
    Returns:
        Número de sessões removidas
    """
    try:
        execute_write(
            """
            DELETE FROM sessoes_ativas 
            WHERE expira_em < NOW() OR 
                  (ativo = 0 AND encerrado_em < DATE_SUB(NOW(), INTERVAL 30 DAY))
            """
        )
        
        print(f"[sessao] Sessões expiradas removidas")
        return 0  # MySQL não retorna affected_rows facilmente
    
    except Exception as e:
        print(f"[sessao] Erro ao limpar sessões expiradas: {e}")
        return 0
