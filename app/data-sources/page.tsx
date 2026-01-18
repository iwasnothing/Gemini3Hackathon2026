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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
            <p className="text-gray-600 mt-1">
              Configure and manage your data source connections
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Data Source
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {source.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {source.type.toUpperCase()}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {source.type === 'bigquery' ? (
                    <>
                      <div className="text-sm">
                        <span className="text-gray-500">Project ID:</span>{' '}
                        <span className="text-gray-900">{source.projectId || source.host}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Dataset:</span>{' '}
                        <span className="text-gray-900">{source.dataset || source.database}</span>
                      </div>
                      {source.location && (
                        <div className="text-sm">
                          <span className="text-gray-500">Location:</span>{' '}
                          <span className="text-gray-900">{source.location}</span>
                        </div>
                      )}
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
                      <div className="text-sm">
                        <span className="text-gray-500">Username:</span>{' '}
                        <span className="text-gray-900">{source.username}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(source.status)}
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                        source.status
                      )}`}
                    >
                      {source.status}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/data-sources/${source.id}/schema`)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add Data Source</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="snowflake">Snowflake</option>
              <option value="bigquery">GCP BigQuery</option>
            </select>
          </div>
          {isBigQuery && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>GCP BigQuery Connection</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Provide your BigQuery project details and service account credentials
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isBigQuery ? (
                <>
                  Project ID <span className="text-red-500">*</span>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {isBigQuery && (
              <p className="mt-1 text-xs text-gray-500">
                Your Google Cloud Project ID
              </p>
            )}
          </div>
          {isBigQuery ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dataset <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                  placeholder="e.g., analytics_dataset"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The BigQuery dataset name you want to connect to
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., US, EU, asia-northeast1 (default: US)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: BigQuery dataset location (US, EU, or specific region)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Account Email
                </label>
                <input
                  type="email"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="service-account@project-id.iam.gserviceaccount.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Service account email (usually found in the JSON key file)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Account Key (JSON File) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  required={isBigQuery}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {serviceAccountKeyFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    <span>{serviceAccountKeyFile.name} uploaded successfully</span>
                  </p>
                )}
                {!serviceAccountKeyFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    Upload your GCP service account key JSON file. Download from Google Cloud Console → IAM & Admin → Service Accounts
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.database}
                    onChange={(e) =>
                      setFormData({ ...formData, database: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
