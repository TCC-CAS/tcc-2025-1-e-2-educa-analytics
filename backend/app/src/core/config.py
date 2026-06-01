import os


class Config:
    """
    Configurações lidas das variáveis de ambiente.
    Na AWS Lambda, defina essas variáveis em:
    Lambda > Configuration > Environment variables
    """

    # ── Banco de Dados ─────────────────────────────────────────
    @staticmethod
    def DB_HOST() -> str: return os.environ.get("DB_HOST", "localhost")
    @staticmethod
    def DB_PORT() -> int: return int(os.environ.get("DB_PORT", 3306))
    @staticmethod
    def DB_NAME() -> str: return os.environ.get("DB_NAME", "educa_analytics")
    @staticmethod
    def DB_USER() -> str: return os.environ.get("DB_USER", "root")
    @staticmethod
    def DB_PASSWORD() -> str: return os.environ.get("DB_PASSWORD", "")

    # ── Segurança ──────────────────────────────────────────────
    @staticmethod
    def JWT_SECRET() -> str: return os.environ.get("JWT_SECRET", "change-me-in-production")
    @staticmethod
    def JWT_EXPIRATION_HOURS() -> int: return int(os.environ.get("JWT_EXPIRATION_HOURS", 8))

    # ── CORS ───────────────────────────────────────────────────
    @staticmethod
    def ALLOWED_ORIGINS() -> str: return os.environ.get("ALLOWED_ORIGINS", "*")

    # ── E-mail (SMTP) ──────────────────────────────────────────
    @staticmethod
    def SMTP_HOST() -> str: return os.environ.get("SMTP_HOST", "")
    @staticmethod
    def SMTP_PORT() -> int: return int(os.environ.get("SMTP_PORT", 587))
    @staticmethod
    def SMTP_USER() -> str: return os.environ.get("SMTP_USER", "")
    @staticmethod
    def SMTP_PASSWORD() -> str: return os.environ.get("SMTP_PASSWORD", "")
    @staticmethod
    def SMTP_FROM_NAME() -> str: return os.environ.get("SMTP_FROM_NAME", "educaAnalytics")

    # ── Frontend ───────────────────────────────────────────────
    @staticmethod
    def APP_URL() -> str: return os.environ.get("APP_URL", "http://localhost:4200")

    # ── reCAPTCHA ──────────────────────────────────────────────
    @staticmethod
    def RECAPTCHA_SECRET_KEY() -> str: return os.environ.get("RECAPTCHA_SECRET_KEY", "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe")
    
    @staticmethod
    def RECAPTCHA_ENABLED() -> bool: return os.environ.get("RECAPTCHA_ENABLED", "true").lower() == "true"

    # ── OAuth Google ───────────────────────────────────────────
    @staticmethod
    def GOOGLE_CLIENT_ID() -> str: return os.environ.get("GOOGLE_CLIENT_ID", "")
    @staticmethod
    def GOOGLE_CLIENT_SECRET() -> str: return os.environ.get("GOOGLE_CLIENT_SECRET", "")
    @staticmethod
    def GOOGLE_REDIRECT_URI() -> str:
        app_url = os.environ.get("APP_URL", "http://localhost:4200")
        return os.environ.get("GOOGLE_REDIRECT_URI", f"{app_url}/auth/callback/google")

    # ── OAuth Microsoft ────────────────────────────────────────
    @staticmethod
    def MICROSOFT_CLIENT_ID() -> str: return os.environ.get("MICROSOFT_CLIENT_ID", "")
    @staticmethod
    def MICROSOFT_CLIENT_SECRET() -> str: return os.environ.get("MICROSOFT_CLIENT_SECRET", "")
    @staticmethod
    def MICROSOFT_REDIRECT_URI() -> str:
        app_url = os.environ.get("APP_URL", "http://localhost:4200")
        return os.environ.get("MICROSOFT_REDIRECT_URI", f"{app_url}/auth/callback/microsoft")

    # ── Ambiente ───────────────────────────────────────────────
    @staticmethod
    def ENV() -> str: return os.environ.get("ENV", "development")

    @classmethod
    def is_production(cls) -> bool:
        return cls.ENV() == "production"
