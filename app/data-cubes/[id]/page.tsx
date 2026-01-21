'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataCube } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

export default function DataCubeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cubeId = params.id as string;
  const [cube, setCube] = useState<DataCube | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataCube();
  }, [cubeId]);

  const fetchDataCube = async () => {
    try {
      const response = await fetch('/api/data-cubes');
      const data = await response.json();
      const found = data.find((c: DataCube) => c.id === cubeId);
      setCube(found || null);
    } catch (error) {
      console.error('Error fetching AI Semitic Data Layer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-white">Loading...</div>
      </Layout>
    );
  }

  if (!cube) {
    return (
      <Layout>
        <div className="text-center py-12 text-white">AI Semitic Data Layer not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to AI Semitic Data Layer
        </button>

        <div className="mb-6 glass rounded-xl p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{cube.name}</h1>
          <p className="text-gray-300 mt-1">{cube.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Query</h2>
            <div className="glass-strong p-4 rounded-lg">
              <code className="text-sm text-gray-300 whitespace-pre-wrap">
                {cube.query}
              </code>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Metadata
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Dimensions</div>
                <div className="flex flex-wrap gap-2">
                  {cube.dimensions.map((dim) => (
                    <span
                      key={dim}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded border border-blue-500/30"
                    >
                      {dim}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Measures</div>
                <div className="flex flex-wrap gap-2">
                  {cube.measures.map((measure) => (
                    <span
                      key={measure}
                      className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded border border-green-500/30"
                    >
                      {measure}
                    </span>
                  ))}
                </div>
              </div>
              {cube.metadata && Object.keys(cube.metadata).length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Additional Metadata</div>
                  <div className="glass-strong p-3 rounded">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(cube.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-white/10">
                <div className="text-sm text-gray-400">Created</div>
                <div className="text-sm text-white">
                  {new Date(cube.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {cube.data && cube.data.length > 0 && (
          <div className="mt-6 glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Sample Data
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="glass-strong">
                  <tr>
                    {Object.keys(cube.data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-medium text-white uppercase"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {cube.data.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx}>
                      {Object.values(row).map((val: any, i: number) => (
                        <td key={i} className="px-4 py-3 text-sm text-gray-300">
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
      </div>
    </Layout>
  );
}
