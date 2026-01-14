'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataCube } from '@/lib/types';
import { Plus, Search, ArrowRight } from 'lucide-react';

export default function DataCubesPage() {
  const [dataCubes, setDataCubes] = useState<DataCube[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDataCubes();
  }, []);

  const fetchDataCubes = async () => {
    try {
      const response = await fetch('/api/data-cubes');
      const data = await response.json();
      setDataCubes(data);
    } catch (error) {
      console.error('Error fetching data cubes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Cubes</h1>
            <p className="text-gray-600 mt-1">
              Create data cubes using natural language queries
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Data Cube
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataCubes.map((cube) => (
              <div
                key={cube.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cube.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {cube.description}
                </p>
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Dimensions</div>
                  <div className="flex flex-wrap gap-2">
                    {cube.dimensions.map((dim) => (
                      <span
                        key={dim}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Measures</div>
                  <div className="flex flex-wrap gap-2">
                    {cube.measures.map((measure) => (
                      <span
                        key={measure}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                      >
                        {measure}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-4">
                  Created {new Date(cube.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => router.push(`/data-cubes/${cube.id}`)}
                  className="w-full bg-primary-50 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-100 flex items-center justify-center gap-2"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <DataCubeModal
            onClose={() => setShowModal(false)}
            onSave={fetchDataCubes}
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
        }),
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating data cube:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Data Cube</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales by Month"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your data cube..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Query (Natural Language)
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me monthly sales totals grouped by month"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe what data you want to see in natural language
            </p>
          </div>
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Processing...' : 'Preview Query'}
          </button>
        </div>

        {preview && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Preview Results
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {preview.data?.[0] &&
                      Object.keys(preview.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-medium">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data?.slice(0, 5).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      {Object.values(row).map((val: any, i: number) => (
                        <td key={i} className="py-2 px-3">
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

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !query.trim()}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Data Cube
          </button>
        </div>
      </div>
    </div>
  );
}
