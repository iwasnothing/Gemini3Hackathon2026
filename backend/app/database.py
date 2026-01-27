from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory or parent directory
env_path = Path(__file__).parent.parent / '.env'
if not env_path.exists():
    # Try parent directory (project root)
    env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# Database connection from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "securebi")

# Validate that we're not using the system database
if DB_NAME.lower() in ['mysql', 'information_schema', 'performance_schema', 'sys']:
    raise ValueError(
        f"ERROR: Cannot use '{DB_NAME}' as database name. "
        "This is a MySQL system database. Please use a separate application database. "
        "Create one with: CREATE DATABASE securebi;"
    )

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
