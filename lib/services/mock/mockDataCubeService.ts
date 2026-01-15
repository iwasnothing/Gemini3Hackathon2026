import { IDataCubeService } from '../interfaces';
import { mockDataCubes } from '../../mockData';
import { DataCube } from '../../types';

export class MockDataCubeService implements IDataCubeService {
  async getAll(): Promise<DataCube[]> {
    return mockDataCubes;
  }

  async create(data: Partial<DataCube>): Promise<DataCube> {
    return {
      id: `cube-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    } as DataCube;
  }

  async query(query: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      data: [
        { month: '2024-01', sales: 125000, orders: 1234 },
        { month: '2024-02', sales: 142000, orders: 1456 },
        { month: '2024-03', sales: 138000, orders: 1398 },
      ],
      query,
    };
  }
}
