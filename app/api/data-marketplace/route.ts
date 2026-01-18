import { NextRequest, NextResponse } from 'next/server';
import { dataSourceService } from '@/lib/services/factory';
import { mockTables } from '@/lib/mockData';
import { mockDataCubes } from '@/lib/mockData';
import { mockDashboards } from '@/lib/mockData';
import { filterDataSourcesByEntitlements, filterDataCubesByEntitlements, filterDashboardsByEntitlements, getUserFromRequest } from '@/lib/utils/entitlements';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserFromRequest(request);
    
    // Fetch all data sources and filter by entitlements
    const allDataSources = await dataSourceService.getAll();
    const filteredDataSources = filterDataSourcesByEntitlements(allDataSources, userId);
    
    // For each data source, get its tables
    const dataSourcesWithTables = await Promise.all(
      filteredDataSources.map(async (source) => {
        const tables = mockTables[source.id] || [];
        return {
          ...source,
          tables,
        };
      })
    );

    // Get and filter data cubes
    const filteredDataCubes = filterDataCubesByEntitlements(mockDataCubes, userId);

    // Get and filter dashboards
    const filteredDashboards = filterDashboardsByEntitlements(mockDashboards, userId);

    return NextResponse.json({
      dataSources: dataSourcesWithTables,
      dataCubes: filteredDataCubes,
      dashboards: filteredDashboards,
    });
  } catch (error) {
    console.error('Error fetching marketplace data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace data' },
      { status: 500 }
    );
  }
}
