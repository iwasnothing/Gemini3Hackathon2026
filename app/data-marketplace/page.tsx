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
  Plus,
  MoreVertical,
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
  const [editingCube, setEditingCube] = useState<DataCube | null>(null);
  const [cubeMenuOpenId, setCubeMenuOpenId] = useState<string | null>(null);
  const [cubeActionLoadingId, setCubeActionLoadingId] = useState<string | null>(null);
  const [cubeActionError, setCubeActionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMarketplaceData();
    }
  }, [user]);

  const fetchMarketplaceData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/data-marketplace', {
        headers: {
          'x-user-id': user.id,
        },
        cache: 'no-store', // Ensure fresh data from database
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch marketplace data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched marketplace data:', {
        dataSources: data.dataSources?.length || 0,
        dataCubes: data.dataCubes?.length || 0,
        dashboards: data.dashboards?.length || 0
      });
      console.log('Data cubes from database:', data.dataCubes);
      setMarketplaceData(data);
      setCubeActionError(null);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-soft-mint" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-cream" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // Helper function to get key columns with PK/FK info
  const getKeyColumns = (tables: Table[] | undefined) => {
    if (!tables || !Array.isArray(tables)) {
      return [];
    }
    const keyColumns: Array<{ name: string; type: string; isPK: boolean; isFK: boolean; fkReference?: string }> = [];
    tables.forEach((table) => {
      if (table.columns && Array.isArray(table.columns)) {
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
      }
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
        (source.tables && Array.isArray(source.tables) && source.tables.some((table) => 
          table.name.toLowerCase().includes(query) ||
          table.description?.toLowerCase().includes(query)
        ))
    );

    const filteredCubes = marketplaceData.dataCubes.filter(
      (cube) =>
        cube.name?.toLowerCase().includes(query) ||
        cube.description?.toLowerCase().includes(query)
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

  const handleDeleteCube = async (cubeId: string) => {
    setCubeActionLoadingId(cubeId);
    setCubeActionError(null);

    try {
      const response = await fetch(`/api/data-cubes/${cubeId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        let message = `Failed to delete data cube (${response.status})`;
        try {
          const data = await response.json();
          message = data.detail || data.error || message;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      await fetchMarketplaceData();
      setCubeMenuOpenId(null);
    } catch (error) {
      console.error('Error deleting data cube:', error);
      setCubeActionError(
        error instanceof Error ? error.message : 'Failed to delete data cube'
      );
    } finally {
      setCubeActionLoadingId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-soft-mint mb-2">Data Marketplace</h1>
            <p className="text-cream mt-1">
              Browse and discover all available data layers and semantic layers
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCube(null);
              setShowModal(true);
            }}
            className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all flex items-center gap-2 ml-4"
          >
            <Plus className="w-5 h-5" />
            Create AI Semitic Data Layer
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cream w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Search data layers, tables, or cubes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-4 glass rounded-xl p-4">
            <Filter className="w-5 h-5 text-cream" />
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
                      : 'glass text-pale-gold hover:glass-strong hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-cream">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} found
            </div>
          </div>
        </div>

        {/* Data Layer Section */}
        {(selectedCategory === 'all' || selectedCategory === 'sources') && filteredData.sources.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold text-soft-mint">Data Layer</h2>
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
                      <h3 className="text-lg font-semibold text-soft-mint">{source.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {source.type === 'bigquery' ? (
                      <>
                        <div className="text-sm">
                          <span className="text-cream">Project:</span>{' '}
                          <span className="text-white">{source.projectId || source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-cream">Dataset:</span>{' '}
                          <span className="text-white">{source.dataset || source.database}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm">
                          <span className="text-cream">Host:</span>{' '}
                          <span className="text-white">{source.host}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-cream">Database:</span>{' '}
                          <span className="text-white">{source.database}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-4">
                    {/* 1. Dataset Purpose and Source */}
                    <div>
                      <div className="text-xs font-medium text-pale-gold mb-2">Dataset Purpose & Source</div>
                      <div className="text-sm text-white">
                        <div className="mb-1">
                          <span className="text-cream">Purpose:</span>{' '}
                          <span>Analytical dataset for {source.name.toLowerCase()} operations and reporting</span>
                        </div>
                        <div>
                          <span className="text-cream">Source:</span>{' '}
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
                          <div className="text-xs font-medium text-pale-gold mb-2">Key Reports & Insights</div>
                          <div className="space-y-1">
                            {relatedInsights.slice(0, 3).map((insight) => (
                              <div key={insight.id} className="text-sm text-white flex items-center gap-2">
                                <Box className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                <span className="truncate">{insight.name}</span>
                              </div>
                            ))}
                            {relatedInsights.length > 3 && (
                              <div className="text-xs text-cream">
                                +{relatedInsights.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-medium text-pale-gold mb-2">Key Reports & Insights</div>
                          <div className="text-sm text-white">No insights available yet</div>
                        </div>
                      );
                    })()}

                    {/* 3. Key Columns with PK/FK */}
                    {(() => {
                      const keyColumns = getKeyColumns(source.tables);
                      return keyColumns.length > 0 ? (
                        <div>
                          <div className="text-xs font-medium text-pale-gold mb-2">Key Columns (PK/FK)</div>
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
                                  <span className="px-1.5 py-0.5 bg-soft-mint/20 text-soft-mint rounded text-[10px] border border-soft-mint/30">
                                    FK
                                  </span>
                                )}
                                {col.fkReference && (
                                  <span className="text-cream text-[10px] truncate">
                                    → {col.fkReference}
                                  </span>
                                )}
                              </div>
                            ))}
                            {keyColumns.length > 5 && (
                              <div className="text-xs text-cream">
                                +{keyColumns.length - 5} more columns
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-medium text-pale-gold mb-2">Key Columns (PK/FK)</div>
                          <div className="text-sm text-cream">No key columns defined</div>
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
              <h2 className="text-2xl font-semibold text-soft-mint">Semantic Layer</h2>
              <span className="text-sm text-white">({filteredData.cubes.length})</span>
            </div>
            {cubeActionError && (
              <div className="mb-3 p-3 glass rounded-lg border border-red-500/40 text-xs text-red-300">
                {cubeActionError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.cubes.map((cube) => (
                <div
                  key={cube.id}
                  className="glass rounded-xl p-6 hover:glass-strong transition-all cursor-pointer"
                  onClick={() => router.push(`/data-cubes/${cube.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-soft-mint truncate pr-2">
                      {cube.name}
                    </h3>
                    <div className="relative flex items-center gap-2">
                      <button
                        type="button"
                        className="p-1 rounded-full hover:bg-white/10 text-cream"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCubeMenuOpenId((prev) => (prev === cube.id ? null : cube.id));
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {cubeMenuOpenId === cube.id && (
                        <div
                          className="absolute right-0 top-6 w-32 glass rounded-lg shadow-lg border border-white/10 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10 rounded-t-lg"
                            onClick={() => {
                              setCubeMenuOpenId(null);
                              // Open edit modal with this cube
                              setEditingCube(cube);
                              setShowModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/20 rounded-b-lg disabled:opacity-60"
                            disabled={cubeActionLoadingId === cube.id}
                            onClick={() => handleDeleteCube(cube.id)}
                          >
                            {cubeActionLoadingId === cube.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-cream mb-4 line-clamp-2">{cube.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-pale-gold">Dimensions:</span>
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
                      <span className="text-xs font-medium text-pale-gold">Measures:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cube.measures.map((measure) => (
                          <span
                            key={measure}
                            className="text-xs px-2 py-1 bg-soft-mint/20 text-soft-mint rounded border border-soft-mint/30"
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

        {/* Debug: Show data cube count */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 glass rounded-lg text-xs text-cream">
            <div>Total Data Cubes in DB: {marketplaceData?.dataCubes?.length || 0}</div>
            <div>Filtered Cubes: {filteredData.cubes.length}</div>
            <div>Selected Category: {selectedCategory}</div>
            <div>Search Query: {searchQuery || '(empty)'}</div>
          </div>
        )}

        {/* Empty State */}
        {totalItems === 0 && (
          <div className="text-center py-12 glass rounded-xl">
            <Search className="w-12 h-12 text-cream mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-soft-mint mb-2">No results found</h3>
            <p className="text-cream">
              {marketplaceData?.dataCubes?.length === 0 
                ? "No data cubes found in database. Create one using the button above."
                : "Try adjusting your search query or filter criteria"}
            </p>
          </div>
        )}

        {showModal && (
          <DataCubeModal
            onClose={() => setShowModal(false)}
            onSave={fetchMarketplaceData}
            initialCube={editingCube}
          />
        )}
      </div>
    </Layout>
  );
}

function DataCubeModal({
  onClose,
  onSave,
  initialCube,
}: {
  onClose: () => void;
  onSave: () => void;
  initialCube?: DataCube | null;
}) {
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataSourceId, setDataSourceId] = useState('');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [generatedCube, setGeneratedCube] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialCube;

  useEffect(() => {
    // Fetch data sources when modal opens
    fetchDataSources();
  }, []);

  useEffect(() => {
    if (initialCube) {
      setName(initialCube.name || '');
      setDescription(initialCube.description || '');
      setQuery(initialCube.query || '');
      setDataSourceId(initialCube.dataSourceId);
      setGeneratedCube({
        name: initialCube.name,
        description: initialCube.description,
        query: initialCube.query,
        dimensions: initialCube.dimensions || [],
        measures: initialCube.measures || [],
        metadata: initialCube.metadata || {},
      });
      setPreview({
        query: initialCube.query,
        dimensions: initialCube.dimensions || [],
        measures: initialCube.measures || [],
        metadata: initialCube.metadata || {},
        data: null,
      });
    } else {
      // reset when switching back to create
      setQuery('');
      setName('');
      setDescription('');
      setGeneratedCube(null);
      setPreview(null);
      setError(null);
      setPreviewError(null);
    }
  }, [initialCube]);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources');
      if (response.ok) {
        const sources = await response.json();
        setDataSources(sources);
        if (sources.length > 0) {
          setDataSourceId((prev) => prev || initialCube?.dataSourceId || sources[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };

  const handleGenerate = async () => {
    if (!query.trim() || !dataSourceId) {
      setError('Please provide a natural language query and select a data source');
      return;
    }
    
    setGenerating(true);
    setError(null);
    setGeneratedCube(null);
    setPreviewError(null);
    
    try {
      const response = await fetch('/api/data-cubes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_request: query,
          data_source_id: dataSourceId, // Backend expects snake_case
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.error || `Failed to generate data cube (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setGeneratedCube(data);
      
      // Populate form fields with generated data
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      
      // Show preview of the generated query
      setPreview({
        query: data.query,
        dimensions: data.dimensions,
        measures: data.measures,
        metadata: data.metadata,
        data: null,
      });
    } catch (error) {
      console.error('Error generating data cube:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate data cube');
    } finally {
      setGenerating(false);
    }
  };

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

  const handlePreview = async () => {
    if (!generatedCube?.query || !dataSourceId) {
      setError('Please generate a data cube first before previewing.');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/preview-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: generatedCube.query,
          maxRows: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.detail || data.error || 'Failed to preview SQL. Please try regenerating the SQL.';
        throw new Error(errorMessage);
      }

      setPreview((prev: any) => ({
        ...(prev || {}),
        data: data.rows || data.data || [],
      }));
    } catch (err) {
      console.error('Error previewing SQL:', err);
      setPreviewError(err instanceof Error ? err.message : 'Failed to preview SQL');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please provide a name for the data cube');
      return;
    }
    
    if (!generatedCube && !query.trim()) {
      setError('Please generate a data cube first or provide a SQL query');
      return;
    }
    
    if (!dataSourceId) {
      setError('Please select a data source');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use generated cube data if available, otherwise use form inputs
      // Backend expects snake_case field names
      const cubeData = generatedCube
        ? {
            name,
            description: description || generatedCube.description,
            query: generatedCube.query,
            data_source_id: dataSourceId, // Backend expects snake_case
            dimensions: generatedCube.dimensions || [],
            measures: generatedCube.measures || [],
            metadata: generatedCube.metadata || {},
          }
        : {
            name,
            description,
            query,
            data_source_id: dataSourceId, // Backend expects snake_case
            dimensions: [],
            measures: [],
            metadata: {},
          };

      const endpoint =
        isEdit && initialCube?.id ? `/api/data-cubes/${initialCube.id}` : '/api/data-cubes';
      const method = isEdit && initialCube?.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cubeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail ||
          errorData.error ||
          `Failed to ${isEdit ? 'update' : 'create'} data cube (${response.status})`;
        throw new Error(errorMessage);
      }

      const savedCube = await response.json();
      console.log(`Data cube ${isEdit ? 'updated' : 'created'} successfully:`, savedCube);
      
      // Close modal first
      onClose();
      
      // Immediately refresh marketplace data to show the newly saved cube from database
      // The database commit should be complete by the time the response is received
      try {
        await onSave();
        console.log('Marketplace data refreshed after creating data cube');
      } catch (refreshError) {
        console.error('Error refreshing marketplace data:', refreshError);
        // Still try to refresh even if there's an error
        await onSave();
      }
    } catch (error) {
      console.error('Error saving AI Semantic Data Layer:', error);
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEdit ? 'update' : 'create'} data cube`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="glass-strong rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-soft-mint">Create AI Semantic Data Layer</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Data Source *
            </label>
            <select
              value={dataSourceId}
              onChange={(e) => setDataSourceId(e.target.value)}
              className="w-full px-3 py-2 glass rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a data source</option>
              {dataSources.map((source) => (
                <option key={source.id} value={source.id} className="bg-gray-800">
                  {source.name} ({source.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Query (Natural Language) *
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me monthly sales totals grouped by month"
              rows={4}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-cream mt-1">
              Describe what data you want to see in natural language. The AI will generate the SQL query, dimensions, and measures.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !query.trim() || !dataSourceId}
            className="w-full glass-strong px-4 py-2 rounded-lg text-white hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating with AI...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Generate Data Cube with AI
              </>
            )}
          </button>

          {generatedCube && (
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="w-full mt-2 glass px-4 py-2 rounded-lg text-white hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {previewLoading ? 'Previewing...' : 'Preview'}
            </button>
          )}
          
          {error && (
            <div className="p-3 glass rounded-lg border border-red-500/50">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {previewError && (
            <div className="p-3 glass rounded-lg border border-red-500/50 space-y-2">
              <p className="text-sm text-red-400">{previewError}</p>
              <button
                type="button"
                onClick={handleGenerate}
                className="glass px-3 py-1 rounded-lg text-xs text-white hover:glass-active"
              >
                Re-generate SQL
              </button>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Name *
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
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your AI Semantic Data Layer..."
              rows={2}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {preview && preview.query && (
          <div className="mb-6 p-4 glass rounded-lg">
            <h3 className="text-sm font-medium text-white mb-3">
              Generated Data Cube Structure
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-pale-gold mb-1">SQL Query:</p>
                <pre className="text-xs text-cream bg-black/30 p-2 rounded overflow-x-auto">
                  {preview.query}
                </pre>
              </div>
              {preview.dimensions && preview.dimensions.length > 0 && (
                <div>
                  <p className="text-xs text-pale-gold mb-1">Dimensions:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.dimensions.map((dim: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {preview.measures && preview.measures.length > 0 && (
                <div>
                  <p className="text-xs text-pale-gold mb-1">Measures:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.measures.map((measure: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                        {measure}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {preview && preview.data && (
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
                        <td key={i} className="py-2 px-3 text-cream">
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
            disabled={loading || !name.trim() || (!generatedCube && !query.trim())}
            className="flex-1 px-4 py-2 glass-strong text-white rounded-lg hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Create AI Semantic Data Layer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
