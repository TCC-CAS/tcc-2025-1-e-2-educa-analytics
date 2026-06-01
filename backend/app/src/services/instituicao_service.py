"""
Serviço de busca de instituições de ensino.

Implementa busca híbrida:
1. Busca local (lista das principais instituições brasileiras) - rápido
2. Busca no e-MEC (dados oficiais do MEC) - completo
3. Cache de resultados - otimização
"""
from __future__ import annotations

import re
from typing import List, Dict
from datetime import datetime, timedelta

# Cache simples em memória
_cache: Dict[str, tuple[List[str], datetime]] = {}
_CACHE_DURATION = timedelta(hours=24)


# ── Lista de instituições principais do Brasil ────────────────────────────────

INSTITUICOES_BRASILEIRAS = [
    # Universidades Federais
    "Universidade de São Paulo (USP)",
    "Universidade Federal do Rio de Janeiro (UFRJ)",
    "Universidade Federal de Minas Gerais (UFMG)",
    "Universidade Federal do Rio Grande do Sul (UFRGS)",
    "Universidade Federal de São Paulo (UNIFESP)",
    "Universidade Federal do Paraná (UFPR)",
    "Universidade Federal de Santa Catarina (UFSC)",
    "Universidade Federal da Bahia (UFBA)",
    "Universidade Federal de Pernambuco (UFPE)",
    "Universidade Federal do Ceará (UFC)",
    "Universidade Federal do Pará (UFPA)",
    "Universidade Federal de Goiás (UFG)",
    "Universidade Federal do Espírito Santo (UFES)",
    "Universidade Federal Fluminense (UFF)",
    "Universidade Federal de São Carlos (UFSCar)",
    "Universidade Federal de Juiz de Fora (UFJF)",
    "Universidade Federal de Uberlândia (UFU)",
    "Universidade Federal de Viçosa (UFV)",
    "Universidade Federal de Lavras (UFLA)",
    "Universidade Federal do ABC (UFABC)",
    "Universidade Federal Rural do Rio de Janeiro (UFRRJ)",
    "Universidade Federal Rural de Pernambuco (UFRPE)",
    "Universidade Federal do Maranhão (UFMA)",
    "Universidade Federal do Amazonas (UFAM)",
    "Universidade Federal de Mato Grosso (UFMT)",
    "Universidade Federal de Mato Grosso do Sul (UFMS)",
    "Universidade Federal de Alagoas (UFAL)",
    "Universidade Federal de Sergipe (UFS)",
    "Universidade Federal do Rio Grande do Norte (UFRN)",
    "Universidade Federal da Paraíba (UFPB)",
    "Universidade Federal do Piauí (UFPI)",
    "Universidade Federal de Rondônia (UNIR)",
    "Universidade Federal de Roraima (UFRR)",
    "Universidade Federal do Tocantins (UFT)",
    "Universidade Federal do Acre (UFAC)",
    "Universidade Federal do Amapá (UNIFAP)",
    
    # Universidades Estaduais
    "Universidade Estadual de Campinas (UNICAMP)",
    "Universidade Estadual Paulista (UNESP)",
    "Universidade do Estado do Rio de Janeiro (UERJ)",
    "Universidade Estadual de Londrina (UEL)",
    "Universidade Estadual de Maringá (UEM)",
    "Universidade do Estado de Santa Catarina (UDESC)",
    "Universidade Estadual de Feira de Santana (UEFS)",
    "Universidade Estadual do Ceará (UECE)",
    "Universidade Estadual da Paraíba (UEPB)",
    "Universidade do Estado da Bahia (UNEB)",
    "Universidade do Estado do Pará (UEPA)",
    "Universidade do Estado do Amazonas (UEA)",
    "Universidade Estadual de Ponta Grossa (UEPG)",
    "Universidade Estadual do Centro-Oeste (UNICENTRO)",
    "Universidade Estadual do Oeste do Paraná (UNIOESTE)",
    "Universidade Estadual do Norte do Paraná (UENP)",
    
    # Institutos Federais (principais)
    "Instituto Federal de São Paulo (IFSP)",
    "Instituto Federal do Rio de Janeiro (IFRJ)",
    "Instituto Federal de Minas Gerais (IFMG)",
    "Instituto Federal do Paraná (IFPR)",
    "Instituto Federal de Santa Catarina (IFSC)",
    "Instituto Federal do Rio Grande do Sul (IFRS)",
    "Instituto Federal da Bahia (IFBA)",
    "Instituto Federal de Pernambuco (IFPE)",
    "Instituto Federal do Ceará (IFCE)",
    "Instituto Federal de Brasília (IFB)",
    "Instituto Federal Goiano (IF Goiano)",
    "Instituto Federal de Goiás (IFG)",
    
    # Universidades Particulares de Destaque
    "Pontifícia Universidade Católica de São Paulo (PUC-SP)",
    "Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)",
    "Pontifícia Universidade Católica de Minas Gerais (PUC Minas)",
    "Pontifícia Universidade Católica do Paraná (PUC-PR)",
    "Pontifícia Universidade Católica do Rio Grande do Sul (PUC-RS)",
    "Pontifícia Universidade Católica de Campinas (PUC-Campinas)",
    "Universidade Presbiteriana Mackenzie",
    "Universidade Metodista de São Paulo",
    "Fundação Getulio Vargas (FGV)",
    "Escola de Administração de Empresas de São Paulo (FGV-EAESP)",
    "Insper - Instituto de Ensino e Pesquisa",
    "Faculdade de Direito de São Bernardo do Campo",
    "FAAP - Fundação Armando Alvares Penteado",
    "Universidade Anhembi Morumbi",
    "Universidade Paulista (UNIP)",
    "Universidade Nove de Julho (UNINOVE)",
    "Universidade Cruzeiro do Sul (UNICSUL)",
    "Universidade São Judas Tadeu",
    "Universidade Anhanguera",
    "Universidade Estácio de Sá",
    "Universidade Veiga de Almeida (UVA)",
    "Centro Universitário Ibmec",
    "Universidade Positivo",
    "Centro Universitário Senac",
    
    # Escolas Técnicas Estaduais (SP)
    "ETEC - Escola Técnica Estadual de São Paulo",
    "FATEC - Faculdade de Tecnologia de São Paulo",
    
    # Outras importantes
    "Centro Federal de Educação Tecnológica de Minas Gerais (CEFET-MG)",
    "Centro Federal de Educação Tecnológica do Rio de Janeiro (CEFET-RJ)",
    "Instituto Tecnológico de Aeronáutica (ITA)",
    "Instituto Militar de Engenharia (IME)",
    "Escola Naval",
    "Academia Militar das Agulhas Negras (AMAN)",
]


# ── Funções auxiliares ────────────────────────────────────────────────────────

def _normalizar_texto(texto: str) -> str:
    """Remove acentos e converte para minúsculas."""
    texto = texto.lower()
    # Remove acentos
    substituicoes = {
        'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n'
    }
    for original, substituto in substituicoes.items():
        texto = texto.replace(original, substituto)
    return texto


def _buscar_local(termo: str, limite: int = 10) -> List[str]:
    """Busca nas instituições locais."""
    if not termo or len(termo) < 2:
        return []
    
    termo_norm = _normalizar_texto(termo)
    resultados = []
    
    for instituicao in INSTITUICOES_BRASILEIRAS:
        inst_norm = _normalizar_texto(instituicao)
        # Busca por palavras individuais ou texto completo
        if termo_norm in inst_norm:
            resultados.append(instituicao)
            if len(resultados) >= limite:
                break
    
    return resultados


def _buscar_emec(termo: str, limite: int = 10) -> List[str]:
    """
    Busca no e-MEC (simulação - API real do e-MEC requer parsing de HTML).
    
    Nota: A API do e-MEC não tem endpoint REST público fácil.
    Esta função está preparada para integração futura.
    Por enquanto, retorna lista vazia.
    """
    # TODO: Implementar integração real com e-MEC quando disponível
    # A API do e-MEC atual requer scraping ou uso de datasets
    # Endpoint: https://emec.mec.gov.br/
    
    # Por enquanto, retornamos vazio e usamos apenas busca local
    return []


def _limpar_cache_expirado() -> None:
    """Remove entradas expiradas do cache."""
    agora = datetime.now()
    chaves_expiradas = [
        chave for chave, (_, timestamp) in _cache.items()
        if agora - timestamp > _CACHE_DURATION
    ]
    for chave in chaves_expiradas:
        del _cache[chave]


# ── Interface pública ──────────────────────────────────────────────────────────

def buscar_instituicoes(termo: str, limite: int = 10) -> List[str]:
    """
    Busca instituições de ensino por termo.
    
    Estratégia híbrida:
    1. Verifica cache
    2. Busca local (rápido)
    3. Se poucos resultados, complementa com e-MEC (futuro)
    
    Args:
        termo: Texto para buscar (mínimo 2 caracteres)
        limite: Número máximo de resultados
    
    Returns:
        Lista de nomes de instituições
    """
    if not termo or len(termo.strip()) < 2:
        return []
    
    termo = termo.strip()
    cache_key = f"{termo.lower()}:{limite}"
    
    # Verifica cache
    if cache_key in _cache:
        resultados, timestamp = _cache[cache_key]
        if datetime.now() - timestamp < _CACHE_DURATION:
            return resultados
    
    # Limpa cache expirado periodicamente
    _limpar_cache_expirado()
    
    # Busca local (sempre funciona)
    resultados = _buscar_local(termo, limite)
    
    # Se encontrou poucos resultados, tenta e-MEC (futuro)
    if len(resultados) < 5:
        try:
            resultados_emec = _buscar_emec(termo, limite - len(resultados))
            # Remove duplicatas mantendo ordem
            vistos = set(_normalizar_texto(r) for r in resultados)
            for r in resultados_emec:
                if _normalizar_texto(r) not in vistos:
                    resultados.append(r)
                    vistos.add(_normalizar_texto(r))
                    if len(resultados) >= limite:
                        break
        except Exception as e:
            # Falha no e-MEC não deve quebrar a busca
            print(f"[instituicao_service] Aviso: busca e-MEC falhou - {e}")
    
    # Armazena no cache
    _cache[cache_key] = (resultados, datetime.now())
    
    return resultados


def listar_todas(limite: int = 50) -> List[str]:
    """Retorna lista das principais instituições (para popular dropdowns)."""
    return INSTITUICOES_BRASILEIRAS[:limite]
