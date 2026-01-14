import { DataSource, Table, DataCube, Dashboard } from './types';

export const mockDataSources: DataSource[] = [
  {
    id: 'ds-1',
    name: 'Production PostgreSQL',
    type: 'postgresql',
    host: 'prod-db.company.com',
    port: 5432,
    database: 'analytics',
    username: 'analytics_user',
    status: 'connected',
    lastSync: '2024-01-15T10:30:00Z',
  },
  {
    id: 'ds-2',
    name: 'Sales MySQL',
    type: 'mysql',
    host: 'sales-db.company.com',
    port: 3306,
    database: 'sales',
    username: 'sales_readonly',
    status: 'connected',
    lastSync: '2024-01-15T09:15:00Z',
  },
  {
    id: 'ds-3',
    name: 'Data Warehouse',
    type: 'snowflake',
    host: 'company.snowflakecomputing.com',
    port: 443,
    database: 'WAREHOUSE',
    username: 'bi_user',
    status: 'disconnected',
  },
];

export const mockTables: Record<string, Table[]> = {
  'ds-1': [
    {
      name: 'orders',
      schema: 'public',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true },
        {
          name: 'customer_id',
          type: 'bigint',
          foreignKey: { referencedTable: 'customers', referencedColumn: 'id' },
        },
        { name: 'order_date', type: 'timestamp' },
        { name: 'total_amount', type: 'decimal(10,2)' },
        { name: 'status', type: 'varchar(50)' },
        { name: 'shipping_address', type: 'text' },
      ],
      rowCount: 152340,
      description: 'Customer orders with details',
    },
    {
      name: 'customers',
      schema: 'public',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true },
        { name: 'email', type: 'varchar(255)' },
        { name: 'first_name', type: 'varchar(100)' },
        { name: 'last_name', type: 'varchar(100)' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'country', type: 'varchar(2)' },
      ],
      rowCount: 45230,
      description: 'Customer information',
    },
    {
      name: 'products',
      schema: 'public',
      columns: [
        { name: 'id', type: 'bigint', primaryKey: true },
        { name: 'name', type: 'varchar(255)' },
        { name: 'category', type: 'varchar(100)' },
        { name: 'price', type: 'decimal(10,2)' },
        { name: 'stock_quantity', type: 'integer' },
      ],
      rowCount: 1250,
      description: 'Product catalog',
    },
  ],
  'ds-2': [
    {
      name: 'transactions',
      schema: 'sales',
      columns: [
        { name: 'transaction_id', type: 'bigint', primaryKey: true },
        { name: 'account_id', type: 'bigint' },
        { name: 'amount', type: 'decimal(12,2)' },
        { name: 'transaction_date', type: 'date' },
        { name: 'transaction_type', type: 'varchar(50)' },
      ],
      rowCount: 893450,
      description: 'Financial transactions',
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
