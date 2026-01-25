'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataSource, Table, DataCube } from '@/lib/types';
import { useUser } from '@/contexts/UserContext';
import { 
  Database, 
  Box, 
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
}

export default function DataMarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sources' | 'cubes'>('all');
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
        return <XCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // Helper function to get key columns with PK/FK info
  const getKeyColumns = (tables: Table[]) => {
    const keyColumns: Array<{ name: string; type: string; isPK: boolean; isFK: boolean; fkReference?: string }> = [];
    tables.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.primaryKey || col.foreignKey) {
          keyColumns.push({
            name: `${table.name}.${col.name}`,
            type: col.type,
            isPK: col.primaryKey || false,
            isFK: !!col.foreignKey,
            fkReference: col.foreignKey ? `${col.foreignKey.referencedTable}.${col.foreignKey.referencedColumn}` : undefined,
          });
        }
      });
    });
    return keyColumns;
  };

  // Helper function to get related data cubes (insights/reports)
  const getRelatedInsights = (sourceId: string) => {
    if (!marketplaceData) return [];
    return marketplaceData.dataCubes.filter((cube) => cube.dataSourceId === sourceId);
  };

  const filterData = () => {
    if (!marketplaceData) return { sources: [], cubes: [] };

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

    return {
      sources: filteredSources,
      cubes: filteredCubes,
    };
  };

  const filteredData = filterData();

  const totalItems = 
    (selectedCategory === 'all' || selectedCategory === 'sources' ? filteredData.sources.length : 0) +
    (selectedCategory === 'all' || selectedCategory === 'cubes' ? filteredData.cubes.length : 0);

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
            <h1 className="text-3xl font-bold text-green-400 mb-2">Data Marketplace</h1>
            <p className="text-yellow-400 mt-1">
              Browse and discover all available data layers and semantic layers
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Search data layers, tables, or cubes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-4 glass rounded-xl p-4">
            <Filter className="w-5 h-5 text-yellow-400" />
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'sources', label: 'Data Layer' },
                { value: 'cubes', label: 'Semantic Layer' },
              ].map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category.value
                      ? 'glass-active text-white'
                      : 'glass text-yellow-400 hover:glass-strong hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-yellow-400">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} found
            </div>
          </div>
        </div>

        {/* Data Layer Section */}
        {(selectedCategory === 'all' || selectedCategory === 'sources') && filteredData.sources.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-green-400">Data Layer</h2>
              <span className="text-sm text-white">({filteredData.sources.length})</span>
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
                      <h3 className="text-lg font-semibold text-green-400">{source.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {source.type === 'bigquery' ? (
                      <>
                        <div className="text-sm">
                          <span className="text-yellow-400">Project:</span>{' '}
                          <span className="text-white">{source.projectId || source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-yellow-400">Dataset:</span>{' '}
                          <span className="text-white">{source.dataset || source.database}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm">
                          <span className="text-yellow-400">Host:</span>{' '}
                          <span className="text-white">{source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-yellow-400">Database:</span>{' '}
                          <span className="text-white">{source.database}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-4">
                    {/* 1. Dataset Purpose and Source */}
                    <div>
                      <div className="text-xs font-medium text-yellow-400 mb-2">Dataset Purpose & Source</div>
                      <div className="text-sm text-white">
                        <div className="mb-1">
                          <span className="text-yellow-400">Purpose:</span>{' '}
                          <span>Analytical dataset for {source.name.toLowerCase()} operations and reporting</span>
                        </div>
                        <div>
                          <span className="text-yellow-400">Source:</span>{' '}
                          <span>
                            {source.type === 'bigquery' 
                              ? `${source.projectId || source.host}.${source.dataset || source.database}`
                              : `${source.host}/${source.database}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Key Reports/Insights */}
                    {(() => {
                      const relatedInsights = getRelatedInsights(source.id);
                      return relatedInsights.length > 0 ? (
                        <div>
                          <div className="text-xs font-medium text-yellow-400 mb-2">Key Reports & Insights</div>
                          <div className="space-y-1">
                            {relatedInsights.slice(0, 3).map((insight) => (
                              <div key={insight.id} className="text-sm text-white flex items-center gap-2">
                                <Box className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                <span className="truncate">{insight.name}</span>
                              </div>
                            ))}
                            {relatedInsights.length > 3 && (
                              <div className="text-xs text-yellow-400">
                                +{relatedInsights.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-medium text-yellow-400 mb-2">Key Reports & Insights</div>
                          <div className="text-sm text-white">No insights available yet</div>
                        </div>
                      );
                    })()}

                    {/* 3. Key Columns with PK/FK */}
                    {(() => {
                      const keyColumns = getKeyColumns(source.tables);
                      return keyColumns.length > 0 ? (
                        <div>
                          <div className="text-xs font-medium text-yellow-400 mb-2">Key Columns (PK/FK)</div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {keyColumns.slice(0, 5).map((col, idx) => (
                              <div key={idx} className="text-xs text-white flex items-center gap-2">
                                <span className="font-mono">{col.name}</span>
                                {col.isPK && (
                                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] border border-blue-500/30">
                                    PK
                                  </span>
                                )}
                                {col.isFK && (
                                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded text-[10px] border border-green-500/30">
                                    FK
                                  </span>
                                )}
                                {col.fkReference && (
                                  <span className="text-yellow-400 text-[10px] truncate">
                                    → {col.fkReference}
                                  </span>
                                )}
                              </div>
                            ))}
                            {keyColumns.length > 5 && (
                              <div className="text-xs text-yellow-400">
                                +{keyColumns.length - 5} more columns
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-medium text-yellow-400 mb-2">Key Columns (PK/FK)</div>
                          <div className="text-sm text-yellow-400">No key columns defined</div>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => router.push(`/data-sources/${source.id}/schema`)}
                      className="mt-3 w-full text-sm text-white hover:text-white flex items-center justify-center gap-1"
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
              <h2 className="text-2xl font-semibold text-green-400">Semantic Layer</h2>
              <span className="text-sm text-white">({filteredData.cubes.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.cubes.map((cube) => (
                <div
                  key={cube.id}
                  className="glass rounded-xl p-6 hover:glass-strong transition-all cursor-pointer"
                  onClick={() => router.push(`/data-cubes/${cube.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-green-400">{cube.name}</h3>
                    <ExternalLink className="w-4 h-4 text-yellow-400" />
                  </div>
                  <p className="text-sm text-yellow-400 mb-4 line-clamp-2">{cube.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-yellow-400">Dimensions:</span>
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
                      <span className="text-xs font-medium text-yellow-400">Measures:</span>
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

        {/* Empty State */}
        {totalItems === 0 && (
          <div className="text-center py-12 glass rounded-xl">
            <Search className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-400 mb-2">No results found</h3>
            <p className="text-yellow-400">
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
        <h2 className="text-2xl font-bold mb-4 text-green-400">Create AI Semitic Data Layer</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-1">
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
            <label className="block text-sm font-medium text-yellow-400 mb-1">
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
            <label className="block text-sm font-medium text-yellow-400 mb-1">
              Query (Natural Language)
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me monthly sales totals grouped by month"
              rows={4}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-yellow-400 mt-1">
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
                        <td key={i} className="py-2 px-3 text-yellow-400">
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
