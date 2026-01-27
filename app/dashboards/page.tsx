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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboards: ${response.status}`);
      }
      
      const data = await response.json();
      // Ensure data is an array
      setDashboards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      setDashboards([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-soft-mint mb-2">Dashboards</h1>
            <p className="text-cream mt-1">
              Build and manage interactive dashboards
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all flex items-center gap-2 ml-4"
          >
            <Plus className="w-5 h-5" />
            Create Dashboard
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">Loading...</div>
        ) : dashboards.length === 0 ? (
          <div className="text-center py-12 text-white">
            <p className="text-cream mb-4">No dashboards found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all"
            >
              Create Your First Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="glass rounded-xl p-6 hover:glass-strong transition-all"
              >
                <h3 className="text-lg font-semibold text-soft-mint mb-2">
                  {dashboard.name}
                </h3>
                <p className="text-sm text-cream mb-4 line-clamp-2">
                  {dashboard.description}
                </p>
                <div className="flex items-center justify-between text-xs text-cream mb-4">
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
                  className="w-full glass-strong px-4 py-2 rounded-lg text-white hover:glass-active transition-all flex items-center justify-center gap-2"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glass-strong rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-soft-mint">Create Dashboard</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pale-gold mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              rows={3}
              className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 glass rounded-lg text-white hover:glass-strong transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 glass-strong text-white rounded-lg hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
