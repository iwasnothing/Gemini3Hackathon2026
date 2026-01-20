'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { EntitledResource } from '@/lib/types';
import { Database, Box, LayoutDashboard, Eye, Edit, Trash2, Shield } from 'lucide-react';

export default function DataEntitlementPage() {
  const { user } = useUser();
  const [entitledResources, setEntitledResources] = useState<EntitledResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEntitlements();
    }
  }, [user]);

  const fetchEntitlements = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/data-entitlement?userId=${user.id}`);
      const data = await response.json();
      setEntitledResources(data);
    } catch (error) {
      console.error('Error fetching entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: EntitledResource['resourceType']) => {
    switch (type) {
      case 'dataSource':
        return <Database className="w-5 h-5" />;
      case 'dataCube':
        return <Box className="w-5 h-5" />;
      case 'dashboard':
        return <LayoutDashboard className="w-5 h-5" />;
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'read':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'write':
        return <Edit className="w-4 h-4 text-green-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-500" />;
    }
  };

  const groupByResourceType = (resources: EntitledResource[]) => {
    const grouped: Record<string, EntitledResource[]> = {
      dataSource: [],
      dataCube: [],
      dashboard: [],
    };
    resources.forEach((resource) => {
      grouped[resource.resourceType].push(resource);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </Layout>
    );
  }

  const grouped = groupByResourceType(entitledResources);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Data Entitlement</h1>
          </div>
          <p className="text-gray-600 mt-1">
            View your data access permissions and entitlements
          </p>
          {user && (
            <div className="mt-3 text-sm text-gray-500">
              Logged in as: <span className="font-semibold text-gray-700">{user.name}</span> ({user.email}) - Role: <span className="font-semibold text-gray-700">{user.role}</span>
            </div>
          )}
        </div>

        {entitledResources.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Entitlements Found</h3>
            <p className="text-gray-600">
              You don't have access to any resources at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data Sources */}
            {grouped.dataSource.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6 text-primary-600" />
                  Data Sources ({grouped.dataSource.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped.dataSource.map((resource) => (
                    <div
                      key={`${resource.resourceType}-${resource.resourceId}`}
                      className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getResourceIcon(resource.resourceType)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {resource.resourceName}
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Permissions:</div>
                        <div className="flex flex-wrap gap-2">
                          {resource.permissions.map((perm) => (
                            <div
                              key={perm}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                            >
                              {getPermissionIcon(perm)}
                              <span className="capitalize">{perm}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-3">
                          Granted: {new Date(resource.grantedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Cubes */}
            {grouped.dataCube.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Box className="w-6 h-6 text-primary-600" />
                  AI Semitic Data Layers ({grouped.dataCube.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped.dataCube.map((resource) => (
                    <div
                      key={`${resource.resourceType}-${resource.resourceId}`}
                      className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getResourceIcon(resource.resourceType)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {resource.resourceName}
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Permissions:</div>
                        <div className="flex flex-wrap gap-2">
                          {resource.permissions.map((perm) => (
                            <div
                              key={perm}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                            >
                              {getPermissionIcon(perm)}
                              <span className="capitalize">{perm}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-3">
                          Granted: {new Date(resource.grantedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboards */}
            {grouped.dashboard.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-primary-600" />
                  Dashboards ({grouped.dashboard.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped.dashboard.map((resource) => (
                    <div
                      key={`${resource.resourceType}-${resource.resourceId}`}
                      className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getResourceIcon(resource.resourceType)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {resource.resourceName}
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Permissions:</div>
                        <div className="flex flex-wrap gap-2">
                          {resource.permissions.map((perm) => (
                            <div
                              key={perm}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                            >
                              {getPermissionIcon(perm)}
                              <span className="capitalize">{perm}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-3">
                          Granted: {new Date(resource.grantedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
