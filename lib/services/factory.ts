import { IDataSourceService, IDataCubeService, IDashboardService } from './interfaces';
import { MockDataSourceService } from './mock/mockDataSourceService';
import { MockDataCubeService } from './mock/mockDataCubeService';
import { MockDashboardService } from './mock/mockDashboardService';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export const dataSourceService: IDataSourceService = USE_MOCK
  ? new MockDataSourceService()
  : new MockDataSourceService(); // Replace with real implementation

export const dataCubeService: IDataCubeService = USE_MOCK
  ? new MockDataCubeService()
  : new MockDataCubeService(); // Replace with real implementation

export const dashboardService: IDashboardService = USE_MOCK
  ? new MockDashboardService()
  : new MockDashboardService(); // Replace with real implementation
