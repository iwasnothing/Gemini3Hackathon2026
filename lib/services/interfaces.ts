import { DataSource, Table, DataCube, Dashboard } from '../types';

export interface IDataSourceService {
  getAll(): Promise<DataSource[]>;
  create(data: Partial<DataSource>): Promise<DataSource>;
  getSchema(id: string): Promise<Table[]>;
}

export interface IDataCubeService {
  getAll(): Promise<DataCube[]>;
  create(data: Partial<DataCube>): Promise<DataCube>;
  query(query: string): Promise<{ success: boolean; data: any[]; query: string }>;
}

export interface IDashboardService {
  getAll(): Promise<Dashboard[]>;
  create(data: Partial<Dashboard>): Promise<Dashboard>;
  chat(id: string, message: string): Promise<{ response: string }>;
}
