'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { DataCube } from '@/lib/types';
import { ArrowLeft, Play, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function DataCubeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cubeId = params.id as string;
  const [cube, setCube] = useState<DataCube | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewHasMore, setPreviewHasMore] = useState(false);

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

  const runPreview = useCallback(async (page: number = 0) => {
    if (!cubeId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/data-cubes/${cubeId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.detail || data.error || 'Failed to run preview');
        setPreviewRows([]);
        setPreviewColumns([]);
        return;
      }
      setPreviewRows(data.rows ?? []);
      setPreviewColumns(data.columns ?? []);
      setPreviewPage(page);
      setPreviewHasMore((data.rows?.length ?? 0) === PAGE_SIZE);
    } catch (err) {
      setPreviewError('Failed to connect to backend');
      setPreviewRows([]);
      setPreviewColumns([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [cubeId]);

  useEffect(() => {
    fetchDataCube();
  }, [cubeId]);

  useEffect(() => {
    if (!loading && cube) {
      runPreview(0);
    }
  }, [loading, cube?.id, runPreview]);

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
          className="flex items-center gap-2 text-cream hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to AI Semitic Data Layer
        </button>

        <div className="mb-6 glass rounded-xl p-6">
          <h1 className="text-3xl font-bold text-soft-mint mb-2">{cube.name}</h1>
          <p className="text-cream mt-1">{cube.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-soft-mint mb-4">Query</h2>
            <div className="glass-strong p-4 rounded-lg">
              <code className="text-sm text-cream whitespace-pre-wrap">
                {cube.query}
              </code>
            </div>
            <button
              type="button"
              onClick={() => runPreview(0)}
              disabled={previewLoading}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-soft-mint/20 text-soft-mint rounded-lg border border-soft-mint/30 hover:bg-soft-mint/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {previewLoading ? 'Loading…' : 'Run preview'}
            </button>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-soft-mint mb-4">
              Metadata
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-cream mb-2">Dimensions</div>
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
                <div className="text-sm text-cream mb-2">Measures</div>
                <div className="flex flex-wrap gap-2">
                  {cube.measures.map((measure) => (
                    <span
                      key={measure}
                      className="px-3 py-1 bg-soft-mint/20 text-soft-mint text-sm rounded border border-soft-mint/30"
                    >
                      {measure}
                    </span>
                  ))}
                </div>
              </div>
              {cube.metadata && Object.keys(cube.metadata).length > 0 && (
                <div>
                  <div className="text-sm text-cream mb-2">Additional Metadata</div>
                  <div className="glass-strong p-3 rounded">
                    <pre className="text-xs text-cream whitespace-pre-wrap">
                      {JSON.stringify(cube.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-white/10">
                <div className="text-sm text-cream">Created</div>
                <div className="text-sm text-white">
                  {new Date(cube.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-soft-mint mb-4">
            Preview
          </h2>
          {previewError && (
            <p className="text-red-400 text-sm mb-4">{previewError}</p>
          )}
          {previewColumns.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="glass-strong">
                    <tr>
                      {previewColumns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-medium text-white uppercase"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        {previewColumns.map((col) => (
                          <td key={col} className="px-4 py-3 text-sm text-cream">
                            {row[col] != null ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-cream">
                <span>
                  Page {previewPage + 1}
                  {previewRows.length > 0 && (
                    <span className="ml-2">
                      (rows {(previewPage * PAGE_SIZE) + 1}–{(previewPage * PAGE_SIZE) + previewRows.length})
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => runPreview(previewPage - 1)}
                    disabled={previewLoading || previewPage === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => runPreview(previewPage + 1)}
                    disabled={previewLoading || !previewHasMore}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            !previewLoading && (
              <p className="text-cream/80 text-sm">
                Click &quot;Run preview&quot; to execute the query and show results.
              </p>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
