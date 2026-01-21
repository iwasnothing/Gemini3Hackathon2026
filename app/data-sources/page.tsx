'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataSource } from '@/lib/types';
import { Plus, CheckCircle2, XCircle, AlertCircle, MoreVertical, Database } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function DataSourcesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Data Sources</h1>
            <p className="text-gray-300 mt-1">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="glass rounded-xl p-6 hover:glass-strong transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {source.name}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                      {source.type.toUpperCase()}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {source.type === 'bigquery' ? (
                    <>
                      <div className="text-sm">
                        <span className="text-gray-400">Project ID:</span>{' '}
                        <span className="text-white">{source.projectId || source.host}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Dataset:</span>{' '}
                        <span className="text-white">{source.dataset || source.database}</span>
                      </div>
                      {source.location && (
                        <div className="text-sm">
                          <span className="text-gray-400">Location:</span>{' '}
                          <span className="text-white">{source.location}</span>
                        </div>
                      )}
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
                      <div className="text-sm">
                        <span className="text-gray-400">Username:</span>{' '}
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
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : source.status === 'error'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/data-sources/${source.id}/schema`)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Database className="w-3 h-3" />
                    View Schema
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <DataSourceModal
            onClose={() => setShowModal(false)}
            onSave={fetchDataSources}
          />
        )}
      </div>
    </Layout>
  );
}

function DataSourceModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgresql',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    location: '',
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
    
    // Validate BigQuery requires service account key
    if (isBigQuery && !serviceAccountKeyContent) {
      alert('Please upload a service account key JSON file for BigQuery');
      return;
    }

    try {
      const payload = isBigQuery
        ? {
            name: formData.name,
            type: 'bigquery',
            host: formData.host, // Project ID stored in host for backward compatibility
            port: 443, // Default port for BigQuery
            database: formData.database, // Dataset stored in database for backward compatibility
            username: formData.username || '', // Service account email (optional)
            password: serviceAccountKeyContent, // Service account key JSON content
            projectId: formData.host,
            dataset: formData.database,
            location: formData.location || undefined,
          }
        : formData;

      await fetch('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glass-strong rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-white">Add Data Source</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-300 mb-1">
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
            <label className="block text-sm font-medium text-gray-300 mb-1">
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
              <p className="mt-1 text-xs text-gray-400">
                Your Google Cloud Project ID
              </p>
            )}
          </div>
          {isBigQuery ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                <p className="mt-1 text-xs text-gray-400">
                  The BigQuery dataset name you want to connect to
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                <p className="mt-1 text-xs text-gray-400">
                  Optional: BigQuery dataset location (US, EU, or specific region)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                <p className="mt-1 text-xs text-gray-400">
                  Optional: Service account email (usually found in the JSON key file)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Service Account Key (JSON File) <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  required={isBigQuery}
                  className="w-full px-3 py-2 glass rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:glass-strong file:text-white hover:file:glass-active focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {serviceAccountKeyFile && (
                  <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                    <span>✓</span>
                    <span>{serviceAccountKeyFile.name} uploaded successfully</span>
                  </p>
                )}
                {!serviceAccountKeyFile && (
                  <p className="mt-1 text-xs text-gray-400">
                    Upload your GCP service account key JSON file. Download from Google Cloud Console → IAM & Admin → Service Accounts
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
