import Layout from '@/components/Layout';
import Link from 'next/link';
import { Database, Box, LayoutDashboard, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Insight Canvas
          </h1>
          <p className="text-xl text-gray-600">
            AI-Assisted Self-Served BI Dashboard Tool
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/data-sources"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <Database className="w-8 h-8 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Data Sources</h2>
            <p className="text-gray-600">
              Configure and manage your data source connectors
            </p>
          </Link>

          <Link
            href="/data-cubes"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <Box className="w-8 h-8 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">AI Semitic Data Layer</h2>
            <p className="text-gray-600">
              Create AI Semitic Data Layers with metadata using natural language queries
            </p>
          </Link>

          <Link
            href="/dashboards"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <LayoutDashboard className="w-8 h-8 text-primary-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Dashboards</h2>
            <p className="text-gray-600">
              Build interactive dashboards with AI assistance
            </p>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white p-8 rounded-lg">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-3">AI-Powered Insights</h2>
              <p className="text-primary-100 mb-4">
                Each dashboard comes with an AI assistant that can answer
                questions about your data, provide insights, and help you
                understand trends and patterns.
              </p>
              <ul className="space-y-2 text-primary-100">
                <li>• Natural language queries for data exploration</li>
                <li>• Automatic schema understanding</li>
                <li>• Interactive chart generation</li>
                <li>• Real-time Q&A on dashboard data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
