'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataCube } from '@/lib/types';
import { Plus, Search, ArrowRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function DataCubesPage() {
  const { user } = useUser();
  const [dataCubes, setDataCubes] = useState<DataCube[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchDataCubes();
    }
  }, [user]);

  const fetchDataCubes = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/data-cubes', {
        headers: {
          'x-user-id': user.id,
        },
      });
      const data = await response.json();
      setDataCubes(data);
    } catch (error) {
      console.error('Error fetching AI Semitic Data Layers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">AI Semitic Data Layer</h1>
            <p className="text-gray-300 mt-1">
              Create AI Semitic Data Layers with metadata using natural language queries
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

        {loading ? (
          <div className="text-center py-12 text-white">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataCubes.map((cube) => (
              <div
                key={cube.id}
                className="glass rounded-xl p-6 hover:glass-strong transition-all"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {cube.name}
                </h3>
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {cube.description}
                </p>
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">Dimensions</div>
                  <div className="flex flex-wrap gap-2">
                    {cube.dimensions.map((dim) => (
                      <span
                        key={dim}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                      >
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-1">Measures</div>
                  <div className="flex flex-wrap gap-2">
                    {cube.measures.map((measure) => (
                      <span
                        key={measure}
                        className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30"
                      >
                        {measure}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Created {new Date(cube.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => router.push(`/data-cubes/${cube.id}`)}
                  className="w-full glass-strong px-4 py-2 rounded-lg text-white hover:glass-active transition-all flex items-center justify-center gap-2"
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
