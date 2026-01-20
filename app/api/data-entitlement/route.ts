import { NextRequest, NextResponse } from 'next/server';
import { mockEntitlements } from '@/lib/mockData';
import { mockDataSources, mockDataCubes, mockDashboards } from '@/lib/mockData';
import { EntitledResource } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter or header (in real app, this would come from auth token)
    const userId = request.headers.get('x-user-id') || 
                   request.nextUrl.searchParams.get('userId') || 
                   'user-1'; // Default to user-1 for demo

    // Filter entitlements for the current user
    const userEntitlements = mockEntitlements.filter((ent) => ent.userId === userId);

    // Map entitlements to entitled resources with resource names
    const entitledResources: EntitledResource[] = userEntitlements.map((ent) => {
      let resourceName = 'Unknown Resource';

      switch (ent.resourceType) {
        case 'dataSource':
          const dataSource = mockDataSources.find((ds) => ds.id === ent.resourceId);
          resourceName = dataSource?.name || `Data Source ${ent.resourceId}`;
          break;
        case 'dataCube':
          const dataCube = mockDataCubes.find((dc) => dc.id === ent.resourceId);
          resourceName = dataCube?.name || `Data Cube ${ent.resourceId}`;
          break;
        case 'dashboard':
          const dashboard = mockDashboards.find((d) => d.id === ent.resourceId);
          resourceName = dashboard?.name || `Dashboard ${ent.resourceId}`;
          break;
      }

      return {
        resourceType: ent.resourceType,
        resourceId: ent.resourceId,
        resourceName,
        permissions: ent.permissions,
        grantedAt: ent.grantedAt,
      };
    });

    return NextResponse.json(entitledResources);
  } catch (error) {
    console.error('Error fetching entitlements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
