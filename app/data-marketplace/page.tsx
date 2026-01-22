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
  ExternalLink,
  Plus
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
  const [showModal, setShowModal] = useState(false);

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
          <div className="text-center py-12 text-white">Loading marketplace data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Data Marketplace</h1>
            <p className="text-gray-300 mt-1">
              Browse and discover all available data sources, data cubes, and dashboards
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all flex items-center gap-2 ml-4"
          >
            <Plus className="w-5 h-5" />
            Create AI Semitic Data Layer
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Search data sources, tables, cubes, or dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-4 glass rounded-xl p-4">
            <Filter className="w-5 h-5 text-gray-300" />
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category.value
                      ? 'glass-active text-white'
                      : 'glass text-gray-300 hover:glass-strong hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-300">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} found
            </div>
          </div>
        </div>

        {/* Data Sources Section */}
        {(selectedCategory === 'all' || selectedCategory === 'sources') && filteredData.sources.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">Data Sources</h2>
              <span className="text-sm text-gray-400">({filteredData.sources.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.sources.map((source) => (
                <div
                  key={source.id}
                  className="glass rounded-xl p-6 hover:glass-strong transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {source.type === 'bigquery' ? (
                      <>
                        <div className="text-sm">
                          <span className="text-gray-400">Project:</span>{' '}
                          <span className="text-white">{source.projectId || source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Dataset:</span>{' '}
                          <span className="text-white">{source.dataset || source.database}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm">
                          <span className="text-gray-400">Host:</span>{' '}
                          <span className="text-white">{source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Database:</span>{' '}
                          <span className="text-white">{source.database}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Tables</span>
                      <span className="text-sm text-gray-400">{source.tables.length}</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {source.tables.map((table) => (
                        <div
                          key={table.name}
                          className="flex items-center justify-between p-2 glass rounded hover:glass-strong transition-all"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TableIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-white truncate">
                                {table.name}
                              </div>
                              {table.description && (
                                <div className="text-xs text-gray-400 truncate">
                                  {table.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {table.rowCount.toLocaleString()} rows
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push(`/data-sources/${source.id}/schema`)}
                      className="mt-3 w-full text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"
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
              <Box className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">Data Cubes</h2>
              <span className="text-sm text-gray-400">({filteredData.cubes.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.cubes.map((cube) => (
                <div
                  key={cube.id}
                  className="glass rounded-xl p-6 hover:glass-strong transition-all cursor-pointer"
                  onClick={() => router.push(`/data-cubes/${cube.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{cube.name}</h3>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{cube.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-400">Dimensions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cube.dimensions.map((dim) => (
                          <span
                            key={dim}
                            className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30"
                          >
                            {dim}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-400">Measures:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cube.measures.map((measure) => (
                          <span
                            key={measure}
                            className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30"
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
              <LayoutDashboard className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-white">Dashboards</h2>
              <span className="text-sm text-gray-400">({filteredData.dashboards.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="glass rounded-xl p-6 hover:glass-strong transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{dashboard.name}</h3>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{dashboard.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {dashboard.widgets.length} {dashboard.widgets.length === 1 ? 'widget' : 'widgets'}
                    </span>
                    <span className="text-gray-400">
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
          <div className="text-center py-12 glass rounded-xl">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
            <p className="text-gray-300">
              Try adjusting your search query or filter criteria
            </p>
          </div>
        )}

        {showModal && (
          <DataCubeModal
            onClose={() => setShowModal(false)}
            onSave={fetchMarketplaceData}
          />
        )}
      </div>
    </Layout>
  );
}

function DataCubeModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/data-cubes/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setPreview(data);
    } catch (error) {
      console.error('Error querying:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !query.trim()) return;
    try {
      await fetch('/api/data-cubes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          query,
          dataSourceId: 'ds-1',
          dimensions: ['month'],
          measures: ['sales', 'orders'],
          metadata: {},
        }),
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating AI Semitic Data Layer:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="glass-strong rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-white">Create AI Semitic Data Layer</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales by Month"
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your AI Semitic Data Layer..."
              rows={2}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Query (Natural Language)
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me monthly sales totals grouped by month"
              rows={4}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Describe what data you want to see in natural language
            </p>
          </div>
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="w-full glass px-4 py-2 rounded-lg text-white hover:glass-strong disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Processing...' : 'Preview Query'}
          </button>
        </div>

        {preview && (
          <div className="mb-6 p-4 glass rounded-lg">
            <h3 className="text-sm font-medium text-white mb-3">
              Preview Results
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {preview.data?.[0] &&
                      Object.keys(preview.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-medium text-white">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data?.slice(0, 5).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/10">
                      {Object.values(row).map((val: any, i: number) => (
                        <td key={i} className="py-2 px-3 text-gray-300">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 glass rounded-lg text-white hover:glass-strong transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !query.trim()}
            className="flex-1 px-4 py-2 glass-strong text-white rounded-lg hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Create AI Semitic Data Layer
          </button>
        </div>
      </div>
    </div>
  );
}
