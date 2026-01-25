'use client';

import Layout from '@/components/Layout';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const userGrowthData = [
  { month: 'Jan', users: 50 },
  { month: 'Feb', users: 75 },
  { month: 'Mar', users: 100 },
  { month: 'Apr', users: 120 },
  { month: 'May', users: 150 },
  { month: 'Jun', users: 180 },
  { month: 'Jul', users: 200 },
  { month: 'Aug', users: 230 },
];

const topPages = [
  { name: 'Pages Page 01', percentage: 223 },
  { name: 'Pages Page 02', percentage: 155 },
  { name: 'Pages Page 03', percentage: 98 },
  { name: 'Pages Page 04', percentage: 67 },
  { name: 'Pages Page 05', percentage: 45 },
];

export default function Home() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-soft-mint mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-cream text-lg">
                High-fidelity desktop UI design for SaaS Analytics Dashboard
              </p>
            </div>
            <button className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all">
              View Product
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Users */}
          <div className="glass rounded-xl p-6">
            <p className="text-pale-gold text-sm mb-2">Total Users</p>
            <p className="text-4xl font-bold text-white mb-1">2,300</p>
            <p className="text-cream text-xs mb-2">Total Users</p>
            <div className="flex items-center gap-1 text-soft-mint text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>32.56%</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="glass rounded-xl p-6">
            <p className="text-pale-gold text-sm mb-2">Revenue</p>
            <p className="text-4xl font-bold text-white mb-1">$298.6K</p>
            <p className="text-cream text-xs mb-2">Today</p>
            <div className="flex items-center gap-1 text-soft-mint text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>33.33%</span>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="glass rounded-xl p-6">
            <p className="text-pale-gold text-sm mb-2">Conversion Rate</p>
            <p className="text-4xl font-bold text-white mb-1">0.36%</p>
            <p className="text-cream text-xs mb-2">Average</p>
            <div className="flex items-center gap-1 text-soft-mint text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>0.66%</span>
            </div>
          </div>

          {/* Active Now */}
          <div className="glass rounded-xl p-6">
            <p className="text-pale-gold text-sm mb-2">Active Now</p>
            <p className="text-4xl font-bold text-white mb-1">34</p>
            <div className="flex items-center gap-2 text-cream text-xs">
              <div className="w-2 h-2 rounded-full bg-soft-mint"></div>
              <span>Active Now</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth Chart */}
          <div className="lg:col-span-2 glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-soft-mint mb-4">User Growth</h3>
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-pale-gold">User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-t-2 border-pale-gold"></div>
                <span className="text-pale-gold">Weekly</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="url(#colorUsers)"
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Global Sales */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-soft-mint mb-4">Global Sales</h3>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-cream text-sm">World Map Visualization</div>
            </div>
          </div>
        </div>

        {/* Top Performing Pages */}
        <div className="mt-6 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-soft-mint mb-4">Top Performing Pages</h3>
          <div className="space-y-4">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-cream text-sm">{page.name}</span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.min(page.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium w-12 text-right">
                    {page.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
