"""
Serviço de recuperação de senha (Esqueci minha senha).
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.src.adapters.db_adapter import execute_query, execute_write
from app.src.models.models import LoginModel


# ── Auto-migração: garante que as colunas de reset existam ───────────────────
def _garantir_colunas_reset() -> None:
    """Adiciona colunas de reset de senha na tabela Login se não existirem."""
    colunas = [
        ("token_reset_senha",     "VARCHAR(255) DEFAULT NULL"),
        ("token_reset_expiracao", "DATETIME DEFAULT NULL"),
    ]
    for col, defn in colunas:
        try:
            rows = execute_query(
                "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Login' AND COLUMN_NAME = %s",
                (col,)
            )
            if rows[0]["cnt"] == 0:
                execute_write(f"ALTER TABLE Login ADD COLUMN `{col}` {defn}")
                print(f"[reset_senha] Coluna '{col}' adicionada à tabela Login")
        except Exception as e:
            print(f"[reset_senha] Aviso ao verificar coluna '{col}': {e}")


try:
    _garantir_colunas_reset()
except Exception as _e:
    print(f"[reset_senha] Aviso na migração de colunas: {_e}")


# ── Funções principais ────────────────────────────────────────────────────────

def solicitar_reset_senha(email_ou_id: str) -> Dict:
    """
    Envia email com link para resetar senha (ou loga no console em dev).

    Returns:
        {"sucesso": bool, "mensagem": str}
    """
    # Buscar usuário por email ou matrícula
    usuarios = LoginModel.find_by_email_or_id(email_ou_id)

    if not usuarios:
        # Resposta genérica por segurança (não revela se usuário existe)
        return {
            "sucesso": True,
            "mensagem": "Se o e-mail ou ID existir em nossa base, você receberá instruções para redefinir a senha."
        }

    usuario    = usuarios[0]
    id_matricula = usuario.get("idMatricula")
    email        = usuario.get("email")
    nome         = usuario.get("nome") or ""

    if not email:
        return {
            "sucesso": False,
            "mensagem": "Não há e-mail cadastrado para esta conta. Contate o suporte."
        }

    # Gerar token de reset (armazena o hash; envia o token puro por email)
    token      = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expiracao  = datetime.utcnow() + timedelta(hours=1)

    # Salvar token no banco
    try:
        execute_write(
            """
            UPDATE Login
            SET token_reset_senha = %s,
                token_reset_expiracao = %s
            WHERE idMatricula = %s
            """,
            (token_hash, expiracao, id_matricula)
        )
    except Exception as e:
        print(f"[reset_senha] Erro ao salvar token: {e}")
        return {
            "sucesso": False,
            "mensagem": "Erro interno ao processar a solicitação. Tente novamente."
        }

    # Montar link de reset
    from app.src.core.config import Config
    app_url    = Config.APP_URL().rstrip("/")
    link_reset = f"{app_url}/resetar-senha?token={token}&id={id_matricula}"

    # Enviar email (em dev sem SMTP, loga no console)
    try:
        from app.src.services import email_service
        email_service.enviar_reset_senha(email, link_reset, id_matricula, nome)
        print(f"[reset_senha] Email de recuperação enviado para: {email}")
    except Exception as e:
        print(f"[reset_senha] Erro ao enviar email para {email}: {e}")
        # Em dev sem SMTP configurado, não é um erro — o link foi logado no console
        from app.src.core.config import Config as Cfg
        if Cfg.SMTP_HOST():
            # Só falha se SMTP estava configurado mas o envio falhou
            return {
                "sucesso": False,
                "mensagem": "Erro ao enviar e-mail. Tente novamente mais tarde."
            }

    # Auditoria (falha silenciosa — não bloqueia a resposta)
    try:
        from app.src.services import auditoria_service
        auditoria_service.registrar_evento(
            tipo_evento="reset_senha_solicitado",
            id_matricula=id_matricula,
            email=email,
            sucesso=True
        )
    except Exception:
        pass

    return {
        "sucesso": True,
        "mensagem": "Instruções de recuperação de senha foram enviadas para o seu e-mail."
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

    row      = result[0]
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

    # Hash da nova senha
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
    try:
        from app.src.services import sessao_service
        sessao_service.encerrar_todas_sessoes(id_matricula, exceto_token=None)
    except Exception:
        pass

    # Auditoria
    try:
        from app.src.services import auditoria_service
        auditoria_service.registrar_evento(
            tipo_evento="senha_resetada",
            id_matricula=id_matricula,
            sucesso=True,
            detalhes="Senha redefinida via esqueci senha"
        )
    except Exception:
        pass

    print(f"[reset_senha] Senha resetada para: {id_matricula}")

    return {
        "sucesso": True,
        "mensagem": "Senha redefinida com sucesso. Faça login com a nova senha."
    }
