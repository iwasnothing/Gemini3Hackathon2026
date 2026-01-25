'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Table } from '@/lib/types';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';

export default function SchemaPage() {
  const params = useParams();
  const router = useRouter();
  const dataSourceId = params.id as string;
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    fetchSchema();
  }, [dataSourceId]);

  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/schema`);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error fetching schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDescription = (table: Table) => {
    setEditingTable(table.name);
    setEditedDescription(table.description || '');
  };

  const handleSaveDescription = (tableName: string) => {
    setTables((prev) =>
      prev.map((table) =>
        table.name === tableName
          ? { ...table, description: editedDescription }
          : table
      )
    );
    setEditingTable(null);
    setEditedDescription('');
  };

  const handleCancelEdit = () => {
    setEditingTable(null);
    setEditedDescription('');
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-white">Loading schema...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-yellow-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Data Sources
        </button>

        <div className="mb-6 glass rounded-xl p-6">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Database Schema</h1>
          <p className="text-yellow-400 mt-1">
            View and edit table descriptions
          </p>
        </div>

        <div className="space-y-6">
          {tables.map((table) => (
            <div
              key={table.name}
              className="glass rounded-xl p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-green-400">
                    {table.schema ? `${table.schema}.${table.name}` : table.name}
                  </h2>
                  <p className="text-sm text-yellow-400 mt-1">
                    {table.rowCount.toLocaleString()} rows
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-yellow-400">
                    Description
                  </label>
                  {editingTable !== table.name && (
                    <button
                      onClick={() => handleEditDescription(table)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>
                {editingTable === table.name ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter table description..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveDescription(table.name)}
                        className="px-3 py-1 glass-strong text-white text-sm rounded hover:glass-active flex items-center gap-1 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 glass text-white text-sm rounded hover:glass-strong flex items-center gap-1 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-yellow-400 glass-strong p-3 rounded">
                    {table.description || 'No description provided'}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-3">
                  Columns
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="glass-strong">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                          Primary Key
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                          Foreign Key (Joins To)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {table.columns.map((column) => (
                        <tr key={column.name}>
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            {column.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-400">
                            {column.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-400">
                            {column.primaryKey ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                PK
                              </span>
                            ) : (
                              <span className="text-yellow-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-400">
                            {column.foreignKey ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                  → {column.foreignKey.referencedTable}
                                </span>
                                <span className="text-xs text-yellow-400">
                                  ({column.foreignKey.referencedColumn})
                                </span>
                              </div>
                            ) : (
                              <span className="text-yellow-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-400">
                            {column.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
