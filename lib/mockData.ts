import { DataSource, Table, DataCube, Dashboard, DataEntitlement } from './types';

export const mockDataSources: DataSource[] = [
  {
    id: 'ds-4',
    name: 'GCP BigQuery',
    type: 'bigquery',
    host: 'my-analytics-project', // Project ID
    port: 443,
    database: 'analytics_dataset', // Dataset
    username: 'bigquery-service@my-analytics-project.iam.gserviceaccount.com',
    status: 'connected',
    lastSync: '2024-01-15T11:00:00Z',
    projectId: 'my-analytics-project',
    dataset: 'analytics_dataset',
    location: 'US',
  },
];

export const mockTables: Record<string, Table[]> = {
  'ds-4': [
    {
      name: 'user_events',
      schema: 'analytics_dataset',
      columns: [
        { name: 'event_id', type: 'STRING', primaryKey: true },
        { name: 'user_id', type: 'STRING' },
        { name: 'event_type', type: 'STRING' },
        { name: 'event_timestamp', type: 'TIMESTAMP' },
        { name: 'session_id', type: 'STRING' },
        { name: 'properties', type: 'JSON' },
      ],
      rowCount: 5234100,
      description: 'User interaction events tracked in analytics',
    },
    {
      name: 'pageviews',
      schema: 'analytics_dataset',
      columns: [
        { name: 'pageview_id', type: 'STRING', primaryKey: true },
        { name: 'user_id', type: 'STRING' },
        { name: 'page_path', type: 'STRING' },
        { name: 'page_title', type: 'STRING' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'device_type', type: 'STRING' },
        { name: 'country', type: 'STRING' },
      ],
      rowCount: 8923400,
      description: 'Page view analytics from web traffic',
    },
    {
      name: 'transactions',
      schema: 'analytics_dataset',
      columns: [
        { name: 'transaction_id', type: 'STRING', primaryKey: true },
        { name: 'user_id', type: 'STRING' },
        { name: 'product_id', type: 'STRING' },
        { name: 'amount', type: 'NUMERIC' },
        { name: 'currency', type: 'STRING' },
        { name: 'transaction_date', type: 'DATE' },
        { name: 'status', type: 'STRING' },
      ],
      rowCount: 234500,
      description: 'E-commerce transaction records',
    },
  ],
};

export const mockDataCubes: DataCube[] = [
  {
    id: 'cube-1',
    name: 'Sales by Month',
    description: 'Monthly sales aggregation',
    query: 'SELECT DATE_TRUNC(\'month\', order_date) as month, SUM(total_amount) as total_sales FROM orders GROUP BY month',
    dataSourceId: 'ds-1',
    dimensions: ['month'],
    measures: ['total_sales'],
    createdAt: '2024-01-10T08:00:00Z',
    data: [
      { month: '2024-01-01', total_sales: 125000 },
      { month: '2024-02-01', total_sales: 142000 },
      { month: '2024-03-01', total_sales: 138000 },
    ],
  },
  {
    id: 'cube-2',
    name: 'Customer Segmentation',
    description: 'Customers grouped by purchase behavior',
    query: 'SELECT country, COUNT(*) as customer_count, AVG(total_amount) as avg_order_value FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY country',
    dataSourceId: 'ds-1',
    dimensions: ['country'],
    measures: ['customer_count', 'avg_order_value'],
    createdAt: '2024-01-12T14:30:00Z',
  },
];

export const mockDashboards: Dashboard[] = [
  {
    id: 'dash-1',
    name: 'Sales Overview',
    description: 'Comprehensive sales metrics and trends',
    dataCubeId: 'cube-1',
    widgets: [
      {
        id: 'w-1',
        type: 'metric',
        title: 'Total Sales',
        config: { value: 405000, format: 'currency' },
        x: 0,
        y: 0,
        width: 4,
        height: 2,
      },
      {
        id: 'w-2',
        type: 'line',
        title: 'Sales Trend',
        config: { xAxis: 'month', yAxis: 'total_sales' },
        x: 4,
        y: 0,
        width: 8,
        height: 4,
      },
    ],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

// Mock entitlements - defines what resources each user can access
export const mockEntitlements: DataEntitlement[] = [
  // Admin user (user-1) has access to everything
  { id: 'ent-1', userId: 'user-1', resourceType: 'dataSource', resourceId: 'ds-4', permissions: ['read', 'write', 'delete'], grantedAt: '2024-01-01T00:00:00Z', grantedBy: 'system' },
  { id: 'ent-2', userId: 'user-1', resourceType: 'dataCube', resourceId: 'cube-1', permissions: ['read', 'write', 'delete'], grantedAt: '2024-01-01T00:00:00Z', grantedBy: 'system' },
  { id: 'ent-3', userId: 'user-1', resourceType: 'dataCube', resourceId: 'cube-2', permissions: ['read', 'write', 'delete'], grantedAt: '2024-01-01T00:00:00Z', grantedBy: 'system' },
  { id: 'ent-4', userId: 'user-1', resourceType: 'dashboard', resourceId: 'dash-1', permissions: ['read', 'write', 'delete'], grantedAt: '2024-01-01T00:00:00Z', grantedBy: 'system' },
  
  // Analyst user (user-2) has read/write access to specific resources
  { id: 'ent-5', userId: 'user-2', resourceType: 'dataSource', resourceId: 'ds-4', permissions: ['read'], grantedAt: '2024-01-05T00:00:00Z', grantedBy: 'user-1' },
  { id: 'ent-6', userId: 'user-2', resourceType: 'dataCube', resourceId: 'cube-1', permissions: ['read', 'write'], grantedAt: '2024-01-05T00:00:00Z', grantedBy: 'user-1' },
  { id: 'ent-7', userId: 'user-2', resourceType: 'dashboard', resourceId: 'dash-1', permissions: ['read', 'write'], grantedAt: '2024-01-05T00:00:00Z', grantedBy: 'user-1' },
  
  // Viewer user (user-3) has read-only access to limited resources
  { id: 'ent-8', userId: 'user-3', resourceType: 'dataCube', resourceId: 'cube-1', permissions: ['read'], grantedAt: '2024-01-08T00:00:00Z', grantedBy: 'user-1' },
  { id: 'ent-9', userId: 'user-3', resourceType: 'dashboard', resourceId: 'dash-1', permissions: ['read'], grantedAt: '2024-01-08T00:00:00Z', grantedBy: 'user-1' },
];
