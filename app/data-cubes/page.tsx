'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataCube } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function DataCubesPage() {
  const { user } = useUser();
  const [dataCubes, setDataCubes] = useState<DataCube[]>([]);
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
        <div className="mb-6">
          <div className="glass rounded-xl p-6">
            <h1 className="text-3xl font-bold text-green-400 mb-2">AI Semitic Data Layer</h1>
            <p className="text-yellow-400 mt-1">
              Create AI Semitic Data Layers with metadata using natural language queries
            </p>
          </div>
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
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  {cube.name}
                </h3>
                <p className="text-sm text-yellow-400 mb-4 line-clamp-2">
                  {cube.description}
                </p>
                <div className="mb-4">
                  <div className="text-xs text-yellow-400 mb-1">Dimensions</div>
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
                  <div className="text-xs text-yellow-400 mb-1">Measures</div>
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
                <div className="text-xs text-yellow-400 mb-4">
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
      </div>
    </Layout>
  );
}
