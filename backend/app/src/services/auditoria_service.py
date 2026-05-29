"""
Serviço de auditoria de segurança.
Registra todos os eventos de segurança para compliance LGPD.
"""
from typing import Dict, List, Optional
from datetime import datetime
from app.src.adapters.db_adapter import execute_write, execute_query


def registrar_evento(
    tipo_evento: str,
    id_matricula: str = None,
    email: str = None,
    ip_address: str = None,
    user_agent: str = None,
    sucesso: bool = True,
    detalhes: str = None
):
    """
    Registra um evento de segurança na tabela de auditoria.
    
    Args:
        tipo_evento: Tipo do evento (login_sucesso, login_falha, senha_alterada, etc)
        id_matricula: ID do usuário (opcional)
        email: Email do usuário (opcional)
        ip_address: IP do cliente (opcional)
        user_agent: User-Agent do navegador (opcional)
        sucesso: Se a operação foi bem-sucedida
        detalhes: Informações adicionais em formato JSON string (opcional)
    
    Tipos de evento:
        - login_sucesso: Login bem-sucedido
        - login_falha: Senha incorreta ou usuário não encontrado
        - login_bloqueado: Tentativa de login em conta bloqueada
        - logout: Usuário fez logout
        - senha_criada: Primeira senha definida via token de email
        - senha_alterada: Senha foi alterada
        - token_invalido: Token JWT inválido ou expirado
        - sessao_encerrada: Sessão remota encerrada pelo usuário
        - recaptcha_falha: Validação do reCAPTCHA falhou
    """
    try:
        # Extrair informações do user_agent se disponível
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
        
        execute_write(
            """
            INSERT INTO auditoria_seguranca 
            (tipo_evento, id_matricula, email, ip_address, user_agent, 
             navegador, dispositivo, sucesso, detalhes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (tipo_evento, id_matricula, email, ip_address, user_agent,
             navegador, dispositivo, sucesso, detalhes)
        )
        
        print(f"[auditoria] Evento registrado: {tipo_evento} | {id_matricula or email} | sucesso={sucesso}")
    
    except Exception as e:
        # Não falhar a operação principal se auditoria falhar
        print(f"[auditoria] ERRO ao registrar evento: {e}")


def buscar_eventos(
    id_matricula: str = None,
    tipo_evento: str = None,
    data_inicio: str = None,
    data_fim: str = None,
    limite: int = 100
) -> List[Dict]:
    """
    Busca eventos de auditoria com filtros.
    
    Args:
        id_matricula: Filtrar por usuário
        tipo_evento: Filtrar por tipo de evento
        data_inicio: Data inicial (formato: YYYY-MM-DD)
        data_fim: Data final (formato: YYYY-MM-DD)
        limite: Número máximo de registros
    
    Returns:
        Lista de eventos ordenados por timestamp (mais recente primeiro)
    """
    conditions = []
    params = []
    
    if id_matricula:
        conditions.append("id_matricula = %s")
        params.append(id_matricula)
    
    if tipo_evento:
        conditions.append("tipo_evento = %s")
        params.append(tipo_evento)
    
    if data_inicio:
        conditions.append("DATE(timestamp) >= %s")
        params.append(data_inicio)
    
    if data_fim:
        conditions.append("DATE(timestamp) <= %s")
        params.append(data_fim)
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    query = f"""
        SELECT 
            id, tipo_evento, id_matricula, email, ip_address,
            navegador, dispositivo, sucesso, detalhes,
            DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp
        FROM auditoria_seguranca
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT %s
    """
    params.append(limite)
    
    return execute_query(query, tuple(params))


def relatorio_logins_usuario(id_matricula: str, dias: int = 30) -> dict:
    """
    Gera relatório de logins de um usuário nos últimos N dias.
    
    Returns:
        {
            "total_logins": int,
            "total_falhas": int,
            "ultimos_logins": [...],
            "ips_unicos": [...],
            "dispositivos": {...}
        }
    """
    # Total de logins bem-sucedidos
    logins_sucesso = execute_query(
        """
        SELECT COUNT(*) as total 
        FROM auditoria_seguranca 
        WHERE id_matricula = %s 
        AND tipo_evento = 'login_sucesso'
        AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """,
        (id_matricula, dias)
    )
    
    # Total de falhas
    logins_falha = execute_query(
        """
        SELECT COUNT(*) as total 
        FROM auditoria_seguranca 
        WHERE id_matricula = %s 
        AND tipo_evento = 'login_falha'
        AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """,
        (id_matricula, dias)
    )
    
    # Últimos 10 logins
    ultimos = execute_query(
        """
        SELECT 
            tipo_evento,
            ip_address,
            navegador,
            dispositivo,
            DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp
        FROM auditoria_seguranca
        WHERE id_matricula = %s 
        AND tipo_evento IN ('login_sucesso', 'login_falha')
        AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
        ORDER BY timestamp DESC
        LIMIT 10
        """,
        (id_matricula, dias)
    )
    
    # IPs únicos
    ips = execute_query(
        """
        SELECT DISTINCT ip_address 
        FROM auditoria_seguranca 
        WHERE id_matricula = %s 
        AND tipo_evento = 'login_sucesso'
        AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
        AND ip_address IS NOT NULL
        """,
        (id_matricula, dias)
    )
    
    # Dispositivos usados
    dispositivos = execute_query(
        """
        SELECT 
            navegador,
            dispositivo,
            COUNT(*) as total
        FROM auditoria_seguranca
        WHERE id_matricula = %s 
        AND tipo_evento = 'login_sucesso'
        AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY navegador, dispositivo
        ORDER BY total DESC
        """,
        (id_matricula, dias)
    )
    
    return {
        "total_logins": logins_sucesso[0]["total"] if logins_sucesso else 0,
        "total_falhas": logins_falha[0]["total"] if logins_falha else 0,
        "ultimos_logins": ultimos,
        "ips_unicos": [ip["ip_address"] for ip in ips],
        "dispositivos": dispositivos
    }


def dashboard_seguranca() -> dict:
    """
    Retorna estatísticas gerais de segurança para dashboard administrativo.
    """
    try:
        stats = execute_query("SELECT * FROM vw_dashboard_seguranca LIMIT 1")
        return stats[0] if stats else {}
    except Exception as e:
        print(f"[auditoria] Erro ao buscar dashboard: {e}")
        return {}
