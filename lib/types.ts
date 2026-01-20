export interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'snowflake' | 'bigquery';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  // BigQuery specific fields (optional, uses host/database as projectId/dataset for backward compatibility)
  projectId?: string; // For BigQuery, stored in host if not provided
  dataset?: string; // For BigQuery, stored in database if not provided
  location?: string; // Optional BigQuery location
}

export interface Table {
  name: string;
  schema?: string;
  columns: Column[];
  rowCount: number;
  description?: string;
}

export interface Column {
  name: string;
  type: string;
  primaryKey?: boolean;
  foreignKey?: {
    referencedTable: string;
    referencedColumn: string;
  };
  description?: string;
}

export interface DataCube {
  id: string;
  name: string;
  description: string;
  query: string;
  dataSourceId: string;
  dimensions: string[];
  measures: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  data?: any[];
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  dataCubeId: string;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'table' | 'metric';
  title: string;
  config: any;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface DataEntitlement {
  id: string;
  userId: string;
  resourceType: 'dataSource' | 'dataCube' | 'dashboard';
  resourceId: string;
  permissions: ('read' | 'write' | 'delete')[];
  grantedAt: string;
  grantedBy: string;
}

export interface EntitledResource {
  resourceType: 'dataSource' | 'dataCube' | 'dashboard';
  resourceId: string;
  resourceName: string;
  permissions: ('read' | 'write' | 'delete')[];
  grantedAt: string;
}
