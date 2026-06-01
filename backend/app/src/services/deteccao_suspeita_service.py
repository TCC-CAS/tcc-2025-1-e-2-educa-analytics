"""
Serviço de detecção de atividade suspeita.
Identifica logins anômalos (geolocalização, velocidade impossível, etc).
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
import urllib.request
import json
from app.src.adapters.db_adapter import execute_query, execute_write


# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

# Velocidade impossível: 500km em 2 minutos = alerta
VELOCIDADE_MAXIMA_KM_POR_MINUTO = 250  # 15.000 km/h (avião supersônico)
TEMPO_MINIMO_ENTRE_LOGINS_MINUTOS = 2


# ══════════════════════════════════════════════════════════════════════════════
# GEOLOCALIZAÇÃO DE IP
# ══════════════════════════════════════════════════════════════════════════════

def obter_localizacao_ip(ip_address: str) -> Optional[Dict]:
    """
    Obtém localização geográfica de um IP usando API gratuita.
    
    Args:
        ip_address: Endereço IP
    
    Returns:
        {
            "pais": "BR",
            "cidade": "São Paulo",
            "latitude": -23.5505,
            "longitude": -46.6333
        }
    """
    if not ip_address or ip_address in ["127.0.0.1", "localhost", "::1"]:
        return {
            "pais": "Local",
            "cidade": "localhost",
            "latitude": 0.0,
            "longitude": 0.0
        }
    
    try:
        # API gratuita: http://ip-api.com/json/{ip}
        # Limite: 45 requisições/minuto
        url = f"http://ip-api.com/json/{ip_address}?fields=status,country,countryCode,city,lat,lon"
        
        req = urllib.request.Request(url, headers={"User-Agent": "educaAnalytics/1.0"})
        
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            
            if data.get("status") == "success":
                return {
                    "pais": data.get("countryCode", ""),
                    "pais_nome": data.get("country", ""),
                    "cidade": data.get("city", ""),
                    "latitude": data.get("lat", 0.0),
                    "longitude": data.get("lon", 0.0)
                }
    
    except Exception as e:
        print(f"[deteccao_suspeita] Erro ao obter geolocalização: {e}")
    
    return None


def calcular_distancia(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula distância em km entre duas coordenadas (Haversine).
    
    Returns:
        Distância em quilômetros
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Raio da Terra em km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


# ══════════════════════════════════════════════════════════════════════════════
# DETECÇÃO DE ATIVIDADE SUSPEITA
# ══════════════════════════════════════════════════════════════════════════════

def verificar_login_suspeito(
    id_matricula: str,
    ip_address: str,
    user_agent: str
) -> Dict[str, any]:
    """
    Verifica se login é suspeito comparando com acessos recentes.
    
    Args:
        id_matricula: ID do usuário
        ip_address: IP atual
        user_agent: User-Agent atual
    
    Returns:
        {
            "suspeito": bool,
            "motivo": str,
            "acao_recomendada": str,  # "bloquear", "alertar", "permitir"
            "detalhes": {...}
        }
    """
    # Buscar último login
    ultimo_login = _buscar_ultimo_login(id_matricula)
    
    if not ultimo_login:
        # Primeiro login, não é suspeito
        return {
            "suspeito": False,
            "motivo": "Primeiro login do usuário",
            "acao_recomendada": "permitir"
        }
    
    # Verificar tempo desde último login
    tempo_decorrido = datetime.utcnow() - ultimo_login["timestamp"]
    minutos_decorridos = tempo_decorrido.total_seconds() / 60
    
    # Se login foi há muito tempo, não é suspeito
    if minutos_decorridos > 60:  # Mais de 1 hora
        return {
            "suspeito": False,
            "motivo": "Login anterior foi há mais de 1 hora",
            "acao_recomendada": "permitir"
        }
    
    # Obter localização atual
    loc_atual = obter_localizacao_ip(ip_address)
    loc_anterior = ultimo_login.get("localizacao")
    
    if not loc_atual or not loc_anterior:
        # Não conseguiu obter geolocalização, permitir
        return {
            "suspeito": False,
            "motivo": "Geolocalização indisponível",
            "acao_recomendada": "permitir"
        }
    
    # Calcular distância entre localizações
    distancia_km = calcular_distancia(
        loc_anterior["latitude"], loc_anterior["longitude"],
        loc_atual["latitude"], loc_atual["longitude"]
    )
    
    # Verificar "viagem impossível"
    if distancia_km > 50 and minutos_decorridos < TEMPO_MINIMO_ENTRE_LOGINS_MINUTOS:
        velocidade_km_por_minuto = distancia_km / minutos_decorridos
        
        if velocidade_km_por_minuto > VELOCIDADE_MAXIMA_KM_POR_MINUTO:
            return {
                "suspeito": True,
                "motivo": "Viagem impossível detectada",
                "acao_recomendada": "bloquear",
                "detalhes": {
                    "distancia_km": round(distancia_km, 2),
                    "tempo_minutos": round(minutos_decorridos, 2),
                    "velocidade_km_h": round(velocidade_km_por_minuto * 60, 2),
                    "local_anterior": f"{loc_anterior['cidade']}, {loc_anterior['pais']}",
                    "local_atual": f"{loc_atual['cidade']}, {loc_atual['pais']}"
                }
            }
    
    # Verificar mudança de país suspeita
    if loc_anterior["pais"] != loc_atual["pais"] and minutos_decorridos < 30:
        return {
            "suspeito": True,
            "motivo": "Mudança de país em pouco tempo",
            "acao_recomendada": "alertar",
            "detalhes": {
                "pais_anterior": loc_anterior["pais_nome"],
                "pais_atual": loc_atual["pais_nome"],
                "tempo_minutos": round(minutos_decorridos, 2)
            }
        }
    
    return {
        "suspeito": False,
        "motivo": "Login parece normal",
        "acao_recomendada": "permitir"
    }


def _buscar_ultimo_login(id_matricula: str) -> Optional[Dict]:
    """Busca informações do último login do usuário"""
    try:
        result = execute_query(
            """
            SELECT 
                ip_address,
                timestamp,
                navegador,
                dispositivo,
                detalhes
            FROM auditoria_seguranca
            WHERE id_matricula = %s 
              AND tipo_evento = 'login_sucesso'
              AND timestamp > DATE_SUB(NOW(), INTERVAL 2 HOUR)
            ORDER BY timestamp DESC
            LIMIT 1
            """,
            (id_matricula,)
        )
        
        if not result:
            return None
        
        login = result[0]
        
        # Tentar obter localização do último login
        ip_anterior = login.get("ip_address")
        loc_anterior = obter_localizacao_ip(ip_anterior) if ip_anterior else None
        
        return {
            "ip_address": ip_anterior,
            "timestamp": login.get("timestamp"),
            "localizacao": loc_anterior
        }
    
    except Exception as e:
        print(f"[deteccao_suspeita] Erro ao buscar último login: {e}")
        return None


def registrar_login_suspeito(
    id_matricula: str,
    email: str,
    ip_address: str,
    user_agent: str,
    detalhes_suspeita: Dict
):
    """
    Registra tentativa de login suspeita na auditoria.
    """
    from app.src.services import auditoria_service
    
    auditoria_service.registrar_evento(
        tipo_evento="login_suspeito",
        id_matricula=id_matricula,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        sucesso=False,
        detalhes=json.dumps(detalhes_suspeita, ensure_ascii=False)
    )
    
    print(f"[deteccao_suspeita] ⚠️  Login suspeito: {id_matricula} | {detalhes_suspeita.get('motivo')}")


def registrar_login_suspeito(
    id_matricula: str,
    email: str,
    ip_address: str,
    user_agent: str,
    detalhes_suspeita: Dict
):
    """
    Registra login suspeito e envia email de alerta.
    
    Args:
        id_matricula: ID do usuário
        email: Email do usuário
        ip_address: IP da tentativa
        user_agent: User agent
        detalhes_suspeita: Detalhes da verificação
    """
    from app.src.services import auditoria_service
    
    # Registrar na auditoria
    auditoria_service.registrar_evento(
        tipo_evento="login_suspeito_bloqueado",
        id_matricula=id_matricula,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        sucesso=False,
        detalhes=json.dumps(detalhes_suspeita, ensure_ascii=False)
    )
    
    # Enviar email de notificação
    try:
        from app.src.services import email_service
        
        detalhes_email = {
            "ip_address": ip_address,
            "motivo": detalhes_suspeita.get("motivo", "Atividade suspeita"),
            "localizacao_atual": detalhes_suspeita.get("detalhes", {}).get("localizacao_atual", {})
        }
        
        email_service.enviar_login_suspeito(email, id_matricula, detalhes_email)
    except Exception as e:
        print(f"[deteccao_suspeita] Erro ao enviar email: {e}")
        # Não falhar se email não enviar
    """
    Encerra todas as sessões do usuário por motivo de segurança.
    """
    from app.src.services import sessao_service
    
    total = sessao_service.encerrar_todas_sessoes(id_matricula, exceto_token=None)
    
    print(f"[deteccao_suspeita] 🔒 Sessões invalidadas: {id_matricula} | {motivo} | {total} sessões")
    
    return total
