import { mockEntitlements } from '@/lib/mockData';
import { DataSource, DataCube, Dashboard } from '@/lib/types';

export function getUserEntitlements(userId: string) {
  return mockEntitlements.filter((ent) => ent.userId === userId);
}

export function filterDataSourcesByEntitlements(
  dataSources: DataSource[],
  userId: string
): DataSource[] {
  const userEntitlements = getUserEntitlements(userId);
  const entitledDataSourceIds = userEntitlements
    .filter((ent) => ent.resourceType === 'dataSource' && ent.permissions.includes('read'))
    .map((ent) => ent.resourceId);

  // Admin users see everything (has delete permissions on any resource)
  const hasAdminAccess = userEntitlements.some((ent) => ent.permissions.includes('delete'));
  if (hasAdminAccess) {
    return dataSources;
  }

  return dataSources.filter((ds) => entitledDataSourceIds.includes(ds.id));
}

export function filterDataCubesByEntitlements(
  dataCubes: DataCube[],
  userId: string
): DataCube[] {
  const userEntitlements = getUserEntitlements(userId);
  const entitledDataCubeIds = userEntitlements
    .filter((ent) => ent.resourceType === 'dataCube' && ent.permissions.includes('read'))
    .map((ent) => ent.resourceId);

  // Admin users see everything
  const hasAdminAccess = userEntitlements.some((ent) => ent.permissions.includes('delete'));
  if (hasAdminAccess) {
    return dataCubes;
  }

  return dataCubes.filter((dc) => entitledDataCubeIds.includes(dc.id));
}

export function filterDashboardsByEntitlements(
  dashboards: Dashboard[],
  userId: string
): Dashboard[] {
  const userEntitlements = getUserEntitlements(userId);
  const entitledDashboardIds = userEntitlements
    .filter((ent) => ent.resourceType === 'dashboard' && ent.permissions.includes('read'))
    .map((ent) => ent.resourceId);

  // Admin users see everything
  const hasAdminAccess = userEntitlements.some((ent) => ent.permissions.includes('delete'));
  if (hasAdminAccess) {
    return dashboards;
  }

  return dashboards.filter((d) => entitledDashboardIds.includes(d.id));
}

export function getUserFromRequest(request: Request | { headers: Headers }): string {
  // In a real app, this would extract user from auth token
  // For now, we'll use a header or default to user-1
  const headers = 'headers' in request ? request.headers : new Headers();
  const userId = headers.get('x-user-id') || 'user-1';
  return userId;
}
