'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataSource, Table, DataCube, Dashboard } from '@/lib/types';
import { useUser } from '@/contexts/UserContext';
import { 
  Database, 
  Box, 
  LayoutDashboard, 
  Table as TableIcon,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface DataSourceWithTables extends DataSource {
  tables: Table[];
}

interface MarketplaceData {
  dataSources: DataSourceWithTables[];
  dataCubes: DataCube[];
  dashboards: Dashboard[];
}

export default function DataMarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sources' | 'cubes' | 'dashboards'>('all');

  useEffect(() => {
    if (user) {
      fetchMarketplaceData();
    }
  }, [user]);

  const fetchMarketplaceData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/data-marketplace', {
        headers: {
          'x-user-id': user.id,
        },
      });
      const data = await response.json();
      setMarketplaceData(data);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const filterData = () => {
    if (!marketplaceData) return { sources: [], cubes: [], dashboards: [] };

    const query = searchQuery.toLowerCase();
    
    const filteredSources = marketplaceData.dataSources.filter(
      (source) =>
        source.name.toLowerCase().includes(query) ||
        source.type.toLowerCase().includes(query) ||
        source.tables.some((table) => 
          table.name.toLowerCase().includes(query) ||
          table.description?.toLowerCase().includes(query)
        )
    );

    const filteredCubes = marketplaceData.dataCubes.filter(
      (cube) =>
        cube.name.toLowerCase().includes(query) ||
        cube.description.toLowerCase().includes(query)
    );

    const filteredDashboards = marketplaceData.dashboards.filter(
      (dashboard) =>
        dashboard.name.toLowerCase().includes(query) ||
        dashboard.description.toLowerCase().includes(query)
    );

    return {
      sources: filteredSources,
      cubes: filteredCubes,
      dashboards: filteredDashboards,
    };
  };

  const filteredData = filterData();

  const totalItems = 
    (selectedCategory === 'all' || selectedCategory === 'sources' ? filteredData.sources.length : 0) +
    (selectedCategory === 'all' || selectedCategory === 'cubes' ? filteredData.cubes.length : 0) +
    (selectedCategory === 'all' || selectedCategory === 'dashboards' ? filteredData.dashboards.length : 0);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading marketplace data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Browse and discover all available data sources, data cubes, and dashboards
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search data sources, tables, cubes, or dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'sources', label: 'Data Sources' },
                { value: 'cubes', label: 'Data Cubes' },
                { value: 'dashboards', label: 'Dashboards' },
              ].map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} found
            </div>
          </div>
        </div>

        {/* Data Sources Section */}
        {(selectedCategory === 'all' || selectedCategory === 'sources') && filteredData.sources.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Data Sources</h2>
              <span className="text-sm text-gray-500">({filteredData.sources.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.sources.map((source) => (
                <div
                  key={source.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {source.type === 'bigquery' ? (
                      <>
                        <div className="text-sm">
                          <span className="text-gray-500">Project:</span>{' '}
                          <span className="text-gray-900">{source.projectId || source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Dataset:</span>{' '}
                          <span className="text-gray-900">{source.dataset || source.database}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm">
                          <span className="text-gray-500">Host:</span>{' '}
                          <span className="text-gray-900">{source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Database:</span>{' '}
                          <span className="text-gray-900">{source.database}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Tables</span>
                      <span className="text-sm text-gray-500">{source.tables.length}</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {source.tables.map((table) => (
                        <div
                          key={table.name}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TableIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {table.name}
                              </div>
                              {table.description && (
                                <div className="text-xs text-gray-500 truncate">
                                  {table.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {table.rowCount.toLocaleString()} rows
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push(`/data-sources/${source.id}/schema`)}
                      className="mt-3 w-full text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
                    >
                      View Schema
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Cubes Section */}
        {(selectedCategory === 'all' || selectedCategory === 'cubes') && filteredData.cubes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Data Cubes</h2>
              <span className="text-sm text-gray-500">({filteredData.cubes.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.cubes.map((cube) => (
                <div
                  key={cube.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/data-cubes/${cube.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{cube.name}</h3>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cube.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Dimensions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cube.dimensions.map((dim) => (
                          <span
                            key={dim}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            {dim}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Measures:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cube.measures.map((measure) => (
                          <span
                            key={measure}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                          >
                            {measure}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboards Section */}
        {(selectedCategory === 'all' || selectedCategory === 'dashboards') && filteredData.dashboards.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <LayoutDashboard className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Dashboards</h2>
              <span className="text-sm text-gray-500">({filteredData.dashboards.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{dashboard.name}</h3>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dashboard.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {dashboard.widgets.length} {dashboard.widgets.length === 1 ? 'widget' : 'widgets'}
                    </span>
                    <span className="text-gray-500">
                      Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalItems === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search query or filter criteria
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
