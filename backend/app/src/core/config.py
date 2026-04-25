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

    # ── Ambiente ───────────────────────────────────────────────
    @staticmethod
    def ENV() -> str: return os.environ.get("ENV", "development")

    @classmethod
    def is_production(cls) -> bool:
        return cls.ENV() == "production"
