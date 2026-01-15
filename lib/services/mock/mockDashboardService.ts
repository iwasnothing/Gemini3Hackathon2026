import { IDashboardService } from '../interfaces';
import { mockDashboards } from '../../mockData';
import { Dashboard } from '../../types';

export class MockDashboardService implements IDashboardService {
  async getAll(): Promise<Dashboard[]> {
    return mockDashboards;
  }

  async create(data: Partial<Dashboard>): Promise<Dashboard> {
    return {
      id: `dash-${Date.now()}`,
      widgets: [],
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Dashboard;
  }

  async chat(id: string, message: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      response: `Based on the dashboard data, here's what I found regarding "${message}": The sales trend shows consistent growth with February being the strongest month at $142,000.`,
    };
  }
}
