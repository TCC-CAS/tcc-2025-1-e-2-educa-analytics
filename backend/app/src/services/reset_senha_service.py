"""
Serviço de recuperação de senha (Esqueci minha senha).
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.src.adapters.db_adapter import execute_query, execute_write
from app.src.models.models import LoginModel


def solicitar_reset_senha(email_ou_id: str) -> Dict:
    """
    Envia email com link para resetar senha.
    
    Args:
        email_ou_id: Email ou ID de matrícula
    
    Returns:
        {"sucesso": bool, "mensagem": str}
    """
    # Buscar usuário
    usuarios = LoginModel.find_by_email_or_id(email_ou_id)
    
    if not usuarios:
        # Por segurança, não revelar se usuário existe
        return {
            "sucesso": True,
            "mensagem": "Se o email existir em nossa base, você receberá um link para redefinir a senha."
        }
    
    usuario = usuarios[0]
    id_matricula = usuario.get("idMatricula")
    email = usuario.get("email")
    
    # Gerar token de reset
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Salvar token no banco (válido por 1 hora)
    expiracao = datetime.utcnow() + timedelta(hours=1)
    
    execute_write(
        """
        UPDATE Login 
        SET token_reset_senha = %s,
            token_reset_expiracao = %s
        WHERE idMatricula = %s
        """,
        (token_hash, expiracao, id_matricula)
    )
    
    # Enviar email
    from app.src.services import email_service
    
    # Link de reset (ajustar para produção)
    link_reset = f"http://localhost:4200/resetar-senha?token={token}&id={id_matricula}"
    
    try:
        email_service.enviar_reset_senha(email, link_reset, id_matricula)
        
        # Registrar na auditoria
        from app.src.services import auditoria_service
        auditoria_service.registrar_evento(
            tipo_evento="reset_senha_solicitado",
            id_matricula=id_matricula,
            email=email,
            sucesso=True
        )
        
        print(f"[reset_senha] Email enviado para: {email}")
    
    except Exception as e:
        print(f"[reset_senha] Erro ao enviar email: {e}")
        return {
            "sucesso": False,
            "mensagem": "Erro ao enviar email. Tente novamente mais tarde."
        }
    
    return {
        "sucesso": True,
        "mensagem": "Se o email existir em nossa base, você receberá um link para redefinir a senha."
    }


def validar_token_reset(token: str, id_matricula: str) -> Dict:
    """
    Valida token de reset de senha.
    
    Returns:
        {"valido": bool, "expired": bool, "error": str}
    """
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    result = execute_query(
        """
        SELECT token_reset_senha, token_reset_expiracao
        FROM Login
        WHERE idMatricula = %s
        """,
        (id_matricula,)
    )
    
    if not result:
        return {"valido": False, "expired": False, "error": "Usuário não encontrado"}
    
    row = result[0]
    token_db = row.get("token_reset_senha")
    expiracao = row.get("token_reset_expiracao")
    
    if not token_db:
        return {"valido": False, "expired": False, "error": "Token não solicitado"}
    
    if token_hash != token_db:
        return {"valido": False, "expired": False, "error": "Token inválido"}
    
    # Verificar expiração
    if expiracao:
        if isinstance(expiracao, datetime):
            exp_dt = expiracao
        else:
            exp_dt = datetime.strptime(str(expiracao), "%Y-%m-%d %H:%M:%S")
        
        if datetime.utcnow() > exp_dt:
            return {"valido": False, "expired": True, "error": "Token expirado"}
    
    return {"valido": True, "expired": False}


def resetar_senha(token: str, id_matricula: str, nova_senha: str) -> Dict:
    """
    Redefine a senha do usuário.
    
    Returns:
        {"sucesso": bool, "mensagem": str}
    """
    # Validar token
    validacao = validar_token_reset(token, id_matricula)
    
    if not validacao.get("valido"):
        raise ValueError(validacao.get("error", "Token inválido"))
    
    # Hash da nova senha com Argon2
    from app.src.services.auth_service import _hash_senha
    senha_hash = _hash_senha(nova_senha)
    
    # Atualizar senha e limpar token
    execute_write(
        """
        UPDATE Login
        SET senha = %s,
            senha_definida = 1,
            token_reset_senha = NULL,
            token_reset_expiracao = NULL
        WHERE idMatricula = %s
        """,
        (senha_hash, id_matricula)
    )
    
    # Invalidar todas as sessões (segurança)
    from app.src.services import sessao_service
    sessao_service.encerrar_todas_sessoes(id_matricula, exceto_token=None)
    
    # Registrar auditoria
    from app.src.services import auditoria_service
    auditoria_service.registrar_evento(
        tipo_evento="senha_resetada",
        id_matricula=id_matricula,
        sucesso=True,
        detalhes="Senha redefinida via esqueci senha"
    )
    
    print(f"[reset_senha] Senha resetada para: {id_matricula}")
    
    return {
        "sucesso": True,
        "mensagem": "Senha redefinida com sucesso. Faça login com a nova senha."
    }
