import { IDataSourceService } from '../interfaces';
import { mockDataSources, mockTables } from '../../mockData';
import { DataSource, Table } from '../../types';

export class MockDataSourceService implements IDataSourceService {
  async getAll(): Promise<DataSource[]> {
    return mockDataSources;
  }

  async create(data: Partial<DataSource>): Promise<DataSource> {
    return {
      id: `ds-${Date.now()}`,
      ...data,
      status: 'connected',
      lastSync: new Date().toISOString(),
    } as DataSource;
  }

  async getSchema(id: string): Promise<Table[]> {
    return mockTables[id] || [];
  }
}
