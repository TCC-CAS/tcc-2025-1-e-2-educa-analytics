"""
Sistema de Controle de Acesso Baseado em Perfis (RBAC).
Define permissões para cada tipo de usuário.
"""
from typing import List, Set
from functools import wraps
from app.src.utils.response import unauthorized


# ══════════════════════════════════════════════════════════════════════════════
# DEFINIÇÃO DE PERFIS E PERMISSÕES
# ══════════════════════════════════════════════════════════════════════════════

# Mapeamento de perfis para permissões
PERMISSOES_POR_PERFIL = {
    "administrativo": {
        # Acesso total ao sistema
        "usuarios:criar", "usuarios:ler", "usuarios:atualizar", "usuarios:deletar",
        "matriculas:criar", "matriculas:ler", "matriculas:atualizar", "matriculas:deletar",
        "colaboradores:criar", "colaboradores:ler", "colaboradores:atualizar", "colaboradores:deletar",
        "educadores:criar", "educadores:ler", "educadores:atualizar", "educadores:deletar",
        "turmas:criar", "turmas:ler", "turmas:atualizar", "turmas:deletar",
        "salas:criar", "salas:ler", "salas:atualizar", "salas:deletar",
        "disciplinas:criar", "disciplinas:ler", "disciplinas:atualizar", "disciplinas:deletar",
        "cronograma:criar", "cronograma:ler", "cronograma:atualizar", "cronograma:deletar",
        "eventos:criar", "eventos:ler", "eventos:atualizar", "eventos:deletar",
        "frequencia:criar", "frequencia:ler", "frequencia:atualizar", "frequencia:deletar",
        "notas:criar", "notas:ler", "notas:atualizar", "notas:deletar",
        "atividades:criar", "atividades:ler", "atividades:atualizar", "atividades:deletar",
        "relatorios:ler", "auditoria:ler", "configuracoes:atualizar"
    },
    
    "gestor": {
        # Gestão acadêmica e administrativa
        "usuarios:ler", "usuarios:atualizar",
        "matriculas:criar", "matriculas:ler", "matriculas:atualizar",
        "colaboradores:ler", "colaboradores:atualizar",
        "educadores:criar", "educadores:ler", "educadores:atualizar",
        "turmas:criar", "turmas:ler", "turmas:atualizar", "turmas:deletar",
        "salas:criar", "salas:ler", "salas:atualizar",
        "disciplinas:criar", "disciplinas:ler", "disciplinas:atualizar",
        "cronograma:criar", "cronograma:ler", "cronograma:atualizar",
        "eventos:criar", "eventos:ler", "eventos:atualizar", "eventos:deletar",
        "frequencia:ler", "notas:ler", "atividades:ler",
        "relatorios:ler", "auditoria:ler"
    },
    
    "colaborador": {
        # Funcionários administrativos
        "usuarios:ler",
        "matriculas:criar", "matriculas:ler", "matriculas:atualizar",
        "educadores:ler", "turmas:ler", "salas:ler",
        "disciplinas:ler", "cronograma:ler",
        "eventos:criar", "eventos:ler", "eventos:atualizar",
        "frequencia:ler", "relatorios:ler"
    },
    
    "educador": {
        # Professores
        "turmas:ler",  # Apenas suas turmas
        "salas:ler", "disciplinas:ler", "cronograma:ler",
        "eventos:criar", "eventos:ler", "eventos:atualizar",
        "frequencia:criar", "frequencia:ler", "frequencia:atualizar",
        "notas:criar", "notas:ler", "notas:atualizar",
        "atividades:criar", "atividades:ler", "atividades:atualizar", "atividades:deletar",
        "relatorios:ler"  # Apenas de suas turmas
    },
    
    "educando": {
        # Alunos
        "turmas:ler",  # Apenas sua turma
        "cronograma:ler",  # Apenas seu cronograma
        "eventos:ler",
        "frequencia:ler",  # Apenas sua frequência
        "notas:ler",  # Apenas suas notas
        "atividades:ler"  # Apenas suas atividades
    },
    
    "responsavel": {
        # Pais/Responsáveis
        "turmas:ler",  # Turma do(s) filho(s)
        "cronograma:ler",
        "eventos:ler",
        "frequencia:ler",  # Do(s) filho(s)
        "notas:ler",  # Do(s) filho(s)
        "atividades:ler"
    }
}


# ══════════════════════════════════════════════════════════════════════════════
# FUNÇÕES DE VERIFICAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

def tem_permissao(perfil: str, permissao: str) -> bool:
    """
    Verifica se um perfil tem determinada permissão.
    
    Args:
        perfil: Tipo de usuário (administrativo, gestor, colaborador, etc)
        permissao: Permissão no formato "recurso:acao" (ex: "turmas:criar")
    
    Returns:
        True se o perfil tem a permissão
    """
    perfil_lower = perfil.lower()
    permissoes = PERMISSOES_POR_PERFIL.get(perfil_lower, set())
    return permissao in permissoes


def obter_permissoes(perfil: str) -> Set[str]:
    """
    Retorna todas as permissões de um perfil.
    
    Args:
        perfil: Tipo de usuário
    
    Returns:
        Set de permissões
    """
    perfil_lower = perfil.lower()
    return PERMISSOES_POR_PERFIL.get(perfil_lower, set())


def validar_acesso_recurso(usuario_id: str, perfil: str, recurso_id: str, tipo_recurso: str) -> bool:
    """
    Valida se usuário tem acesso a um recurso específico.
    Exemplo: Educador só acessa suas próprias turmas.
    
    Args:
        usuario_id: ID do usuário fazendo a requisição
        perfil: Perfil do usuário
        recurso_id: ID do recurso sendo acessado
        tipo_recurso: Tipo do recurso (turma, frequencia, nota, etc)
    
    Returns:
        True se tem acesso
    """
    # Admin e Gestor têm acesso a tudo
    if perfil.lower() in ["administrativo", "gestor"]:
        return True
    
    # Educadores só acessam suas turmas/atividades
    if perfil.lower() == "educador" and tipo_recurso in ["turma", "frequencia", "nota", "atividade"]:
        return _educador_tem_acesso(usuario_id, recurso_id, tipo_recurso)
    
    # Educandos só acessam seus próprios dados
    if perfil.lower() == "educando" and tipo_recurso in ["frequencia", "nota", "atividade"]:
        return _educando_tem_acesso(usuario_id, recurso_id, tipo_recurso)
    
    # Responsáveis só acessam dados dos filhos
    if perfil.lower() == "responsavel":
        return _responsavel_tem_acesso(usuario_id, recurso_id, tipo_recurso)
    
    # Colaboradores têm acesso geral de leitura
    if perfil.lower() == "colaborador":
        return True
    
    return False


def _educador_tem_acesso(educador_id: str, recurso_id: str, tipo_recurso: str) -> bool:
    """Verifica se educador tem acesso ao recurso (suas turmas)"""
    from app.src.adapters.db_adapter import execute_query
    
    if tipo_recurso == "turma":
        # Verificar se educador leciona nesta turma
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM Cronograma WHERE idEducador = %s AND idTurma = %s",
            (educador_id, recurso_id)
        )
        return result[0]["cnt"] > 0 if result else False
    
    # Para outros recursos, validar via turma
    return True  # Simplificado - implementar lógica completa conforme necessário


def _educando_tem_acesso(educando_id: str, recurso_id: str, tipo_recurso: str) -> bool:
    """Verifica se educando tem acesso ao recurso (seus dados)"""
    from app.src.adapters.db_adapter import execute_query
    
    if tipo_recurso == "frequencia":
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM Frequencia WHERE idMatricula = %s AND idFrequencia = %s",
            (educando_id, recurso_id)
        )
        return result[0]["cnt"] > 0 if result else False
    
    if tipo_recurso == "nota":
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM Nota WHERE idMatricula = %s AND idNota = %s",
            (educando_id, recurso_id)
        )
        return result[0]["cnt"] > 0 if result else False
    
    return True


def _responsavel_tem_acesso(responsavel_id: str, recurso_id: str, tipo_recurso: str) -> bool:
    """Verifica se responsável tem acesso ao recurso (dados dos filhos)"""
    from app.src.adapters.db_adapter import execute_query
    
    # Buscar IDs dos filhos
    filhos = execute_query(
        "SELECT idMatriculaEducando FROM ResponsavelEducando WHERE idResponsavel = %s",
        (responsavel_id,)
    )
    
    if not filhos:
        return False
    
    ids_filhos = [f["idMatriculaEducando"] for f in filhos]
    
    # Verificar se recurso pertence a algum filho
    if tipo_recurso in ["frequencia", "nota", "atividade"]:
        # Simplificado - implementar verificação específica
        return True
    
    return False


# ══════════════════════════════════════════════════════════════════════════════
# DECORATOR PARA ROTAS
# ══════════════════════════════════════════════════════════════════════════════

def requer_permissao(*permissoes_necessarias: str):
    """
    Decorator para proteger rotas com verificação de permissão.
    
    Uso:
        @requer_permissao("turmas:criar", "turmas:atualizar")
        def criar_turma(event):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(event):
            from app.src.services import auth_service
            
            # Obter usuário autenticado do token JWT
            usuario = auth_service.get_usuario_do_evento(event)
            
            if not usuario:
                return unauthorized("Token inválido ou expirado")
            
            perfil = usuario.get("perfil", "")
            
            # Verificar se tem pelo menos uma das permissões necessárias
            tem_acesso = any(
                tem_permissao(perfil, perm) 
                for perm in permissoes_necessarias
            )
            
            if not tem_acesso:
                print(f"[permissoes] Acesso negado: {usuario.get('id')} ({perfil}) tentou acessar {func.__name__}")
                return {
                    "statusCode": 403,
                    "headers": {
                        "Content-Type": "application/json; charset=utf-8",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": '{"erro": "Você não tem permissão para acessar este recurso"}',
                }
            
            # Adicionar usuário ao evento para uso na função
            event["_usuario"] = usuario
            
            return func(event)
        
        return wrapper
    return decorator


def requer_perfil(*perfis_permitidos: str):
    """
    Decorator para restringir acesso a perfis específicos.
    
    Uso:
        @requer_perfil("administrativo", "gestor")
        def deletar_usuario(event):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(event):
            from app.src.services import auth_service
            
            usuario = auth_service.get_usuario_do_evento(event)
            
            if not usuario:
                return unauthorized("Token inválido ou expirado")
            
            perfil = usuario.get("perfil", "").lower()
            perfis_lower = [p.lower() for p in perfis_permitidos]
            
            if perfil not in perfis_lower:
                print(f"[permissoes] Acesso negado: {usuario.get('id')} ({perfil}) precisa ser {perfis_permitidos}")
                return {
                    "statusCode": 403,
                    "headers": {
                        "Content-Type": "application/json; charset=utf-8",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": '{"erro": "Você não tem permissão para acessar este recurso"}',
                }
            
            event["_usuario"] = usuario
            return func(event)
        
        return wrapper
    return decorator
