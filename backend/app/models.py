from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class DataSourceType(str, enum.Enum):
    postgresql = "postgresql"
    mysql = "mysql"
    mongodb = "mongodb"
    snowflake = "snowflake"
    bigquery = "bigquery"

class DataSourceStatus(str, enum.Enum):
    connected = "connected"
    disconnected = "disconnected"
    error = "error"

class ResourceType(str, enum.Enum):
    dataSource = "dataSource"
    dataCube = "dataCube"
    dashboard = "dashboard"

class Permission(str, enum.Enum):
    read = "read"
    write = "write"
    delete = "delete"

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(DataSourceType), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    database = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=True)  # Encrypted in production
    status = Column(SQLEnum(DataSourceStatus), default=DataSourceStatus.disconnected)
    last_sync = Column(DateTime, nullable=True)
    project_id = Column(String(255), nullable=True)  # For BigQuery
    dataset = Column(String(255), nullable=True)  # For BigQuery
    location = Column(String(255), nullable=True)  # For BigQuery
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    data_cubes = relationship("DataCube", back_populates="data_source", cascade="all, delete-orphan")

class Table(Base):
    __tablename__ = "tables"
    
    id = Column(String(255), primary_key=True)
    data_source_id = Column(String(255), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    schema_name = Column(String(255), nullable=True)
    row_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    columns_json = Column(JSON, nullable=True)  # Store columns as JSON
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class DataCube(Base):
    __tablename__ = "data_cubes"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    query = Column(Text, nullable=False)
    data_source_id = Column(String(255), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False)
    dimensions_json = Column(JSON, nullable=True)  # Store dimensions as JSON array
    measures_json = Column(JSON, nullable=True)  # Store measures as JSON array
    metadata_json = Column(JSON, nullable=True)  # Store metadata as JSON
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    data_source = relationship("DataSource", back_populates="data_cubes")
    dashboards = relationship("Dashboard", back_populates="data_cube", cascade="all, delete-orphan")

class Dashboard(Base):
    __tablename__ = "dashboards"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data_cube_id = Column(String(255), ForeignKey("data_cubes.id", ondelete="CASCADE"), nullable=False)
    widgets_json = Column(JSON, nullable=False)  # Store widgets as JSON array
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    data_cube = relationship("DataCube", back_populates="dashboards")

class DataEntitlement(Base):
    __tablename__ = "data_entitlements"
    
    id = Column(String(255), primary_key=True)
    user_id = Column(String(255), nullable=False, index=True)
    resource_type = Column(SQLEnum(ResourceType), nullable=False)
    resource_id = Column(String(255), nullable=False)
    permissions_json = Column(JSON, nullable=False)  # Store permissions as JSON array
    granted_at = Column(DateTime, server_default=func.now())
    granted_by = Column(String(255), nullable=False)
    
    __table_args__ = (
        {"mysql_engine": "InnoDB"},
    )

class AppConfig(Base):
    __tablename__ = "app_configs"
    
    id = Column(String(255), primary_key=True)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
