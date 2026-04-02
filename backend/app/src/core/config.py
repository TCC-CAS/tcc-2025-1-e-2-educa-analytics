import os


class Config:
    """
    Configurações lidas das variáveis de ambiente.
    Na AWS Lambda, defina essas variáveis em:
    Lambda > Configuration > Environment variables
    """

    # ── Banco de Dados ─────────────────────────────────────────
    DB_HOST: str = os.environ.get("DB_HOST", "localhost")
    DB_PORT: int = int(os.environ.get("DB_PORT", 3306))
    DB_NAME: str = os.environ.get("DB_NAME", "educa_analytics")
    DB_USER: str = os.environ.get("DB_USER", "root")
    DB_PASSWORD: str = os.environ.get("DB_PASSWORD", "")

    # ── Segurança ──────────────────────────────────────────────
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "change-me-in-production")
    JWT_EXPIRATION_HOURS: int = int(os.environ.get("JWT_EXPIRATION_HOURS", 8))

    # ── CORS ───────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = os.environ.get("ALLOWED_ORIGINS", "*")

    # ── Ambiente ───────────────────────────────────────────────
    ENV: str = os.environ.get("ENV", "development")

    @classmethod
    def is_production(cls) -> bool:
        return cls.ENV == "production"
