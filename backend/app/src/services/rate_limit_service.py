"""
Serviço de controle de taxa (rate limiting) e proteção contra brute force.
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.src.adapters.db_adapter import execute_query, execute_write


# Configurações de rate limiting
MAX_TENTATIVAS_NIVEL_1 = 3  # Permitir 3 tentativas sem delay
MAX_TENTATIVAS_NIVEL_2 = 5  # 4-5 tentativas: adicionar delay de 2s
BLOQUEIO_MINUTOS_NIVEL_1 = 15  # 6+ tentativas: bloquear 15 min
BLOQUEIO_MINUTOS_NIVEL_2 = 60  # 10+ tentativas: bloquear 1 hora


def verificar_limite(email_ou_id: str, ip_address: str = None) -> Dict:
    """
    Verifica se o usuário/IP pode tentar login.
    
    Args:
        email_ou_id: Email ou ID de matrícula
        ip_address: IP do cliente (opcional)
    
    Returns:
        {
            "bloqueado": bool,
            "motivo": str,           # Se bloqueado
            "tentativas": int,
            "minutos_restantes": int, # Se bloqueado
            "delay_segundos": int     # Delay recomendado antes de tentar
        }
    """
    row = execute_query(
        """
        SELECT tentativas, bloqueado_ate, ultimo_ip
        FROM tentativas_login 
        WHERE email_ou_id = %s
        LIMIT 1
        """,
        (email_ou_id,)
    )
    
    if not row:
        # Primeiro acesso, tudo ok
        return {
            "bloqueado": False,
            "tentativas": 0,
            "delay_segundos": 0
        }
    
    registro = row[0]
    tentativas = registro.get("tentativas", 0)
    bloqueado_ate = registro.get("bloqueado_ate")
    
    # Verificar se ainda está bloqueado
    if bloqueado_ate:
        agora = datetime.utcnow()
        if bloqueado_ate > agora:
            minutos_restantes = int((bloqueado_ate - agora).total_seconds() / 60) + 1
            return {
                "bloqueado": True,
                "motivo": f"Muitas tentativas falhas. Tente novamente em {minutos_restantes} minuto(s).",
                "tentativas": tentativas,
                "minutos_restantes": minutos_restantes,
                "delay_segundos": 0
            }
        else:
            # Bloqueio expirou, limpar
            limpar_tentativas(email_ou_id)
            return {
                "bloqueado": False,
                "tentativas": 0,
                "delay_segundos": 0
            }
    
    # Não bloqueado, mas verificar delay
    delay = 0
    if tentativas >= MAX_TENTATIVAS_NIVEL_2:
        delay = 2  # 2 segundos de delay entre tentativas
    
    return {
        "bloqueado": False,
        "tentativas": tentativas,
        "delay_segundos": delay
    }


def registrar_falha(email_ou_id: str, ip_address: str = None, user_agent: str = None):
    """
    Registra uma tentativa de login falhada e aplica bloqueio se necessário.
    
    Args:
        email_ou_id: Email ou ID de matrícula
        ip_address: IP do cliente
        user_agent: User-Agent do navegador
    """
    # Verificar tentativas atuais
    row = execute_query(
        "SELECT tentativas FROM tentativas_login WHERE email_ou_id = %s",
        (email_ou_id,)
    )
    
    if row:
        tentativas = row[0]["tentativas"] + 1
        
        # Determinar se deve bloquear
        bloqueado_ate = None
        if tentativas >= 10:
            # 10+ tentativas: bloquear por 1 hora
            bloqueado_ate = datetime.utcnow() + timedelta(minutes=BLOQUEIO_MINUTOS_NIVEL_2)
        elif tentativas >= 6:
            # 6-9 tentativas: bloquear por 15 minutos
            bloqueado_ate = datetime.utcnow() + timedelta(minutes=BLOQUEIO_MINUTOS_NIVEL_1)
        
        # Atualizar registro
        if bloqueado_ate:
            execute_write(
                """
                UPDATE tentativas_login 
                SET tentativas = %s, 
                    bloqueado_ate = %s,
                    ultimo_ip = %s,
                    user_agent = %s
                WHERE email_ou_id = %s
                """,
                (tentativas, bloqueado_ate, ip_address, user_agent, email_ou_id)
            )
            print(f"[rate_limit] {email_ou_id} bloqueado até {bloqueado_ate} ({tentativas} tentativas)")
        else:
            execute_write(
                """
                UPDATE tentativas_login 
                SET tentativas = %s,
                    ultimo_ip = %s,
                    user_agent = %s
                WHERE email_ou_id = %s
                """,
                (tentativas, ip_address, user_agent, email_ou_id)
            )
            print(f"[rate_limit] {email_ou_id} falha registrada ({tentativas} tentativas)")
    else:
        # Primeira tentativa falha
        execute_write(
            """
            INSERT INTO tentativas_login 
            (email_ou_id, tentativas, ultimo_ip, user_agent)
            VALUES (%s, 1, %s, %s)
            """,
            (email_ou_id, ip_address, user_agent)
        )
        print(f"[rate_limit] {email_ou_id} primeira falha registrada")


def limpar_tentativas(email_ou_id: str):
    """
    Limpa as tentativas falhas após login bem-sucedido.
    """
    execute_write(
        "DELETE FROM tentativas_login WHERE email_ou_id = %s",
        (email_ou_id,)
    )
    print(f"[rate_limit] Tentativas limpas para {email_ou_id}")


def listar_bloqueados() -> List[Dict]:
    """
    Lista todas as contas atualmente bloqueadas.
    """
    return execute_query(
        """
        SELECT 
            email_ou_id,
            tentativas,
            ultimo_ip,
            DATE_FORMAT(bloqueado_ate, '%%Y-%%m-%%d %%H:%%i:%%s') as bloqueado_ate,
            TIMESTAMPDIFF(MINUTE, NOW(), bloqueado_ate) as minutos_restantes
        FROM tentativas_login
        WHERE bloqueado_ate > NOW()
        ORDER BY bloqueado_ate DESC
        """
    )


def desbloquear_manual(email_ou_id: str) -> bool:
    """
    Desbloqueia manualmente uma conta (admin).
    """
    try:
        limpar_tentativas(email_ou_id)
        print(f"[rate_limit] {email_ou_id} desbloqueado manualmente")
        return True
    except Exception as e:
        print(f"[rate_limit] Erro ao desbloquear {email_ou_id}: {e}")
        return False
