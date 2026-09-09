import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "local-development-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///cv_melvin.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024
    AI_PROVIDER = os.getenv("AI_PROVIDER", "none")
    PROFILE_PATH = ROOT / "data" / "profile_master.json"
    UPLOAD_ROOT = ROOT / "instance" / "uploads"
