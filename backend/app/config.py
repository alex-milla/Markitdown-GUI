import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/markitdown.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ALGORITHM = "HS256"
CONVERTED_DIR = os.getenv("CONVERTED_DIR", "/var/lib/markitdown-gui/converted")
PROJECT_DIR = os.getenv("PROJECT_DIR", "/root/Markitdown-GUI")
