import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
    CLERK_ISSUER = os.environ.get("CLERK_ISSUER") or os.environ.get("CLERK_JWT_ISSUER")
    CLERK_AUDIENCE = os.environ.get("CLERK_AUDIENCE")
    CLERK_JWKS_URL = os.environ.get("CLERK_JWKS_URL")
