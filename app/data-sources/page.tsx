'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataSource } from '@/lib/types';
import { Plus, CheckCircle2, XCircle, AlertCircle, MoreVertical, Database, Plug, Edit, Trash2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function DataSourcesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const menuElement = menuRefs.current[openMenuId];
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    
    // Use setTimeout to avoid immediate closure when clicking the button
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (user) {
      fetchDataSources();
    }
  }, [user]);

  const fetchDataSources = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/data-sources', {
        headers: {
          'x-user-id': user.id,
        },
      });
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Unexpected response when fetching data sources (expected array)', data);
        setDataSources([]);
        return;
      }

      setDataSources(data);
    } catch (error) {
      console.error('Error fetching data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-soft-mint" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-cream" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-soft-mint/20 text-soft-mint';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    setTestingConnection(sourceId);
    try {
      const response = await fetch(`/api/data-sources/${sourceId}/test-connection`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || 'user-1',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data sources to show updated status
        await fetchDataSources();
        alert('Connection test successful!');
      } else {
        alert(`Connection test failed: ${result.message}`);
        // Refresh to show updated error status
        await fetchDataSources();
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Failed to test connection. Please try again.');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleEdit = (source: DataSource) => {
    setEditingSource(source);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (sourceId: string, sourceName: string) => {
    if (!confirm(`Are you sure you want to delete "${sourceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/data-sources/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || 'user-1',
        },
      });

      if (response.ok || response.status === 204) {
        await fetchDataSources();
        alert('Data source deleted successfully');
      } else {
        const error = await response.json();
        alert(`Failed to delete data source: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting data source:', error);
      alert('Failed to delete data source. Please try again.');
    } finally {
      setOpenMenuId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-soft-mint mb-2">Data Sources</h1>
            <p className="text-cream mt-1">
              Configure and manage your data source connections
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all flex items-center gap-2 ml-4"
          >
            <Plus className="w-5 h-5" />
            Add Data Source
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">Loading...</div>
        ) : Array.isArray(dataSources) && dataSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="glass rounded-xl p-6 hover:glass-strong transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-soft-mint">
                      {source.name}
                    </h3>
                    <p className="text-sm text-cream mt-1">
                      {source.type.toUpperCase()}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === source.id ? null : source.id);
                      }}
                      className="text-cream hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === source.id && (
                      <div 
                        ref={(el) => {
                          if (el) menuRefs.current[source.id] = el;
                        }}
                        className="absolute right-0 mt-2 w-48 glass-strong rounded-lg shadow-lg z-10 border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handleEdit(source)}
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(source.id, source.name)}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {source.type === 'bigquery' ? (
                    <>
                      <div className="text-sm">
                        <span className="text-cream">Project ID:</span>{' '}
                        <span className="text-white">{source.projectId || source.host}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-cream">Dataset:</span>{' '}
                        <span className="text-white">{source.dataset || source.database}</span>
                      </div>
                      {source.location && (
                        <div className="text-sm">
                          <span className="text-cream">Location:</span>{' '}
                          <span className="text-white">{source.location}</span>
                        </div>
                      )}
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
                      <div className="text-sm">
                        <span className="text-cream">Username:</span>{' '}
                        <span className="text-white">{source.username}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(source.status)}
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        source.status === 'connected'
                          ? 'bg-soft-mint/20 text-soft-mint border border-soft-mint/30'
                          : source.status === 'error'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-gray-500/20 text-cream border border-gray-500/30'
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(source.id)}
                      disabled={testingConnection === source.id}
                      className="text-xs text-white hover:text-soft-mint flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Test Connection"
                    >
                      <Plug className={`w-3 h-3 ${testingConnection === source.id ? 'animate-spin' : ''}`} />
                      {testingConnection === source.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => router.push(`/data-sources/${source.id}/schema`)}
                      className="text-xs text-white hover:text-white flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      Schema
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-cream">
            No data sources found. Click &quot;Add Data Source&quot; to create one.
          </div>
        )}

        {showModal && (
          <DataSourceModal
            dataSource={editingSource}
            onClose={() => {
              setShowModal(false);
              setEditingSource(null);
            }}
            onSave={fetchDataSources}
          />
        )}
      </div>
    </Layout>
  );
}

function DataSourceModal({
  dataSource,
  onClose,
  onSave,
}: {
  dataSource?: DataSource | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEditMode = !!dataSource;
  
  const [formData, setFormData] = useState({
    name: dataSource?.name || '',
    type: (dataSource?.type || 'bigquery') as 'postgresql' | 'mysql' | 'mongodb' | 'snowflake' | 'bigquery',
    host: dataSource?.projectId || dataSource?.host || '',
    port: dataSource?.port || 443,
    database: dataSource?.dataset || dataSource?.database || '',
    username: dataSource?.username || '',
    password: '',
    location: dataSource?.location || '',
  });
  const [serviceAccountKeyFile, setServiceAccountKeyFile] = useState<File | null>(null);
  const [serviceAccountKeyContent, setServiceAccountKeyContent] = useState<string>('');

  const isBigQuery = formData.type === 'bigquery';

  const handleTypeChange = (newType: string) => {
    setFormData({ ...formData, type: newType as any });
    // Reset file when switching away from BigQuery
    if (newType !== 'bigquery') {
      setServiceAccountKeyFile(null);
      setServiceAccountKeyContent('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setServiceAccountKeyFile(file);
      try {
        const text = await file.text();
        setServiceAccountKeyContent(text);
        // Validate it's JSON
        JSON.parse(text);
      } catch (error) {
        console.error('Error reading file or invalid JSON:', error);
        alert('Please upload a valid JSON file');
        setServiceAccountKeyFile(null);
        setServiceAccountKeyContent('');
        e.target.value = ''; // Reset file input
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = isBigQuery
        ? {
            name: formData.name,
            type: 'bigquery',
            host: formData.host, // Project ID stored in host for backward compatibility
            port: 443, // Default port for BigQuery
            database: formData.database, // Dataset stored in database for backward compatibility
            username: formData.username || '', // Service account email (optional)
            password: serviceAccountKeyContent || undefined, // Service account key JSON content (optional)
            projectId: formData.host,
            dataset: formData.database,
            location: formData.location || undefined,
          }
        : formData;

      const url = isEditMode ? `/api/data-sources/${dataSource?.id}` : '/api/data-sources';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save data source');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving data source:', error);
      alert(error instanceof Error ? error.message : 'Failed to save data source. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glass-strong rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-soft-mint">
          {isEditMode ? 'Edit Data Source' : 'Add Data Source'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 glass rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="postgresql" className="bg-gray-800">PostgreSQL</option>
              <option value="mysql" className="bg-gray-800">MySQL</option>
              <option value="mongodb" className="bg-gray-800">MongoDB</option>
              <option value="snowflake" className="bg-gray-800">Snowflake</option>
              <option value="bigquery" className="bg-gray-800">GCP BigQuery</option>
            </select>
          </div>
          {isBigQuery && (
            <div className="glass rounded-lg p-3 mb-4 border border-blue-500/30">
              <p className="text-sm text-blue-300">
                <strong>GCP BigQuery Connection</strong>
              </p>
              <p className="text-xs text-blue-200 mt-1">
                Provide your BigQuery project details and service account credentials
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              {isBigQuery ? (
                <>
                  Project ID <span className="text-red-400">*</span>
                </>
              ) : (
                'Host'
              )}
            </label>
            <input
              type="text"
              required
              value={formData.host}
              onChange={(e) =>
                setFormData({ ...formData, host: e.target.value })
              }
              placeholder={isBigQuery ? 'e.g., my-project-id' : ''}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isBigQuery && (
              <p className="mt-1 text-xs text-cream">
                Your Google Cloud Project ID
              </p>
            )}
          </div>
          {isBigQuery ? (
            <>
              <div>
                <label className="block text-sm font-medium text-pale-gold mb-1">
                  Dataset <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                  placeholder="e.g., analytics_dataset"
                  className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-cream">
                  The BigQuery dataset name you want to connect to
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-pale-gold mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., US, EU, asia-northeast1 (default: US)"
                  className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-cream">
                  Optional: BigQuery dataset location (US, EU, or specific region)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-pale-gold mb-1">
                  Service Account Email
                </label>
                <input
                  type="email"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="service-account@project-id.iam.gserviceaccount.com"
                  className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-cream">
                  Optional: Service account email (usually found in the JSON key file)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-pale-gold mb-1">
                  Service Account Key (JSON File)
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 glass rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:glass-strong file:text-white hover:file:glass-active focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {serviceAccountKeyFile && (
                  <p className="mt-2 text-sm text-soft-mint flex items-center gap-1">
                    <span>✓</span>
                    <span>{serviceAccountKeyFile.name} uploaded successfully</span>
                  </p>
                )}
                {!serviceAccountKeyFile && (
                  <p className="mt-1 text-xs text-cream">
                    Optional: Upload your GCP service account key JSON file for authentication. Download from Google Cloud Console → IAM & Admin → Service Accounts. You can add this later when testing the connection.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-pale-gold mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pale-gold mb-1">
                    Database
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.database}
                    onChange={(e) =>
                      setFormData({ ...formData, database: e.target.value })
                    }
                    className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-pale-gold mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pale-gold mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 glass rounded-lg text-white font-medium hover:glass-strong transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 glass-strong text-white rounded-lg hover:glass-active transition-all"
            >
              {isEditMode ? 'Save Changes' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
