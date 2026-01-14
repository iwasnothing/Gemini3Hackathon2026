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
