"""
Serviço de envio de e-mail via SMTP.

Configuração (variáveis de ambiente / .env):
    SMTP_HOST       — ex: smtp.gmail.com
    SMTP_PORT       — ex: 587  (TLS/STARTTLS)
    SMTP_USER       — endereço remetente
    SMTP_PASSWORD   — senha de app do remetente
    SMTP_FROM_NAME  — nome exibido no remetente  (padrão: Educa Analytics)
    APP_URL         — URL base do frontend       (padrão: http://localhost:4200)

Em desenvolvimento, se SMTP_HOST não estiver configurado, o e-mail é apenas
impresso no console para facilitar testes sem servidor SMTP real.
"""
from __future__ import annotations

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.src.core.config import Config


# ── helpers internos ──────────────────────────────────────────────────────────

def _remetente() -> str:
    nome = Config.SMTP_FROM_NAME()
    user = Config.SMTP_USER()
    return f"{nome} <{user}>" if nome else user


def _enviar(destinatario: str, assunto: str, html: str, texto: str) -> None:
    """Envia o e-mail via SMTP com STARTTLS. Loga no console em dev."""
    host = Config.SMTP_HOST()
    if not host:
        # Modo desenvolvimento: sem SMTP configurado
        print(f"\n[EmailService] ── MODO DEV (sem SMTP) ──────────────────────")
        print(f"  Para: {destinatario}")
        print(f"  Assunto: {assunto}")
        print(f"  {texto}")
        print(f"──────────────────────────────────────────────────────────────\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"]    = _remetente()
    msg["To"]      = destinatario

    msg.attach(MIMEText(texto, "plain", "utf-8"))
    msg.attach(MIMEText(html,  "html",  "utf-8"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP(host, Config.SMTP_PORT()) as servidor:
        servidor.ehlo()
        servidor.starttls(context=ctx)
        servidor.login(Config.SMTP_USER(), Config.SMTP_PASSWORD())
        servidor.sendmail(Config.SMTP_USER(), destinatario, msg.as_string())


# ── templates ─────────────────────────────────────────────────────────────────

def _html_boas_vindas(nome: str, link: str, tipo: str) -> str:
    papel = "educando(a)" if tipo == "educando" else "responsável"
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bem-vindo ao Educa Analytics</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Cabeçalho -->
        <tr><td style="background:#1a56db;padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Educa Analytics</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistema de Gestão Escolar</p>
        </td></tr>

        <!-- Corpo -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">Olá, {nome}!</h2>
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
            Sua matrícula no sistema Educa Analytics foi realizada com sucesso.<br>
            Você foi cadastrado(a) como <strong>{papel}</strong>.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Para acessar o sistema, você precisa criar sua senha clicando no botão abaixo.
            Este link é válido por <strong>48 horas</strong>.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr><td style="background:#1a56db;border-radius:6px;">
              <a href="{link}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Criar minha senha
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
          </p>
          <p style="margin:0 0 24px;word-break:break-all;">
            <a href="{link}" style="color:#1a56db;font-size:13px;">{link}</a>
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
            Se você não esperava receber este e-mail, por favor ignore-o.<br>
            Este é um e-mail automático — não responda a esta mensagem.
          </p>
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            © 2026 Educa Analytics · Sistema de Gestão Escolar
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _texto_boas_vindas(nome: str, link: str, tipo: str) -> str:
    papel = "educando(a)" if tipo == "educando" else "responsável"
    return (
        f"Olá, {nome}!\n\n"
        f"Sua matrícula no Educa Analytics foi realizada com sucesso.\n"
        f"Você foi cadastrado(a) como {papel}.\n\n"
        f"Para acessar o sistema, crie sua senha acessando o link abaixo (válido por 48 h):\n"
        f"{link}\n\n"
        f"Se você não esperava este e-mail, ignore-o.\n\n"
        f"Educa Analytics — Sistema de Gestão Escolar"
    )


# ── interface pública ─────────────────────────────────────────────────────────

def enviar_boas_vindas(
    destinatario: str,
    nome: str,
    token: str,
    id_matricula: str,
    tipo: str,  # "educando" | "responsavel"
) -> None:
    """Envia o e-mail de boas-vindas com link de criação de senha."""
    app_url = Config.APP_URL().rstrip("/")
    link = f"{app_url}/criar-senha?token={token}&id={id_matricula}"

    assunto = "Bem-vindo ao Educa Analytics — Crie sua senha"
    html  = _html_boas_vindas(nome, link, tipo)
    texto = _texto_boas_vindas(nome, link, tipo)

    try:
        _enviar(destinatario, assunto, html, texto)
    except Exception as exc:
        # Falha no e-mail não deve desfazer a matrícula
        print(f"[EmailService] ERRO ao enviar para {destinatario}: {exc}")
