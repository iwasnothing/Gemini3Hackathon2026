'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Dashboard } from '@/lib/types';
import { Plus, ArrowRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function DashboardsPage() {
  const { user } = useUser();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchDashboards();
    }
  }, [user]);

  const fetchDashboards = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/dashboards', {
        headers: {
          'x-user-id': user.id,
        },
      });
      const data = await response.json();
      setDashboards(data);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
            <p className="text-gray-600 mt-1">
              Build and manage interactive dashboards
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Dashboard
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {dashboard.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {dashboard.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>
                    {dashboard.widgets.length} widget
                    {dashboard.widgets.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <DashboardModal
            onClose={() => setShowModal(false)}
            onSave={fetchDashboards}
          />
        )}
      </div>
    </Layout>
  );
}

function DashboardModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataCubeId, setDataCubeId] = useState('cube-1');

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          dataCubeId,
        }),
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Dashboard</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
