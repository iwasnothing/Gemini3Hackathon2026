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

# Environment flag to determine connection method
ENV = os.getenv("ENV", "local").upper()

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

# Create engine based on ENV flag
if ENV == "GCP":
    # Use Cloud SQL Connector for GCP
    from google.cloud.sql.connector import Connector, IPTypes
    
    INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")  # "project:region:instance"
    if not INSTANCE_CONNECTION_NAME:
        raise ValueError("INSTANCE_CONNECTION_NAME environment variable is required when ENV=GCP")
    
    # PUBLIC or PRIVATE depending on how you connected Cloud Run to SQL
    IP_TYPE_STR = os.getenv("IP_TYPE", "PUBLIC").upper()
    IP_TYPE = IPTypes.PUBLIC if IP_TYPE_STR == "PUBLIC" else IPTypes.PRIVATE
    
    connector = Connector(ip_type=IP_TYPE, refresh_strategy="LAZY")
    
    def getconn():
        conn = connector.connect(
            INSTANCE_CONNECTION_NAME,
            "pymysql",
            user=DB_USER,
            password=DB_PASSWORD,
            db=DB_NAME,
        )
        return conn
    
    engine = create_engine(
        "mysql+pymysql://",
        creator=getconn,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )
else:
    # Use direct connection for local development
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
