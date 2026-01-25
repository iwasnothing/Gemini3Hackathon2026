'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Dashboard, AIAssistantMessage } from '@/lib/types';
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MessageCircle, Send, Loader } from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const params = useParams();
  const dashboardId = params.id as string;
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [dashboardId]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboards');
      const data = await response.json();
      const found = data.find((d: Dashboard) => d.id === dashboardId);
      setDashboard(found || null);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockData = [
    { month: 'Jan', total_sales: 125000 },
    { month: 'Feb', total_sales: 142000 },
    { month: 'Mar', total_sales: 138000 },
    { month: 'Apr', total_sales: 155000 },
    { month: 'May', total_sales: 148000 },
    { month: 'Jun', total_sales: 162000 },
  ];

  const pieData = [
    { name: 'Product A', value: 400 },
    { name: 'Product B', value: 300 },
    { name: 'Product C', value: 200 },
    { name: 'Product D', value: 100 },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-white">Loading dashboard...</div>
      </Layout>
    );
  }

  if (!dashboard) {
    return (
      <Layout>
        <div className="text-center py-12 text-white">Dashboard not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="glass rounded-xl p-6 flex-1">
            <h1 className="text-3xl font-bold text-soft-mint mb-2">
              {dashboard.name}
            </h1>
            <p className="text-cream mt-1">{dashboard.description}</p>
          </div>
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="glass-strong px-6 py-3 rounded-lg text-white font-medium hover:glass-active transition-all flex items-center gap-2 ml-4"
          >
            <MessageCircle className="w-5 h-5" />
            AI Assistant
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {dashboard.widgets.map((widget) => (
            <div
              key={widget.id}
              className="glass rounded-xl p-6"
              style={{
                gridColumn: widget.width === 8 ? 'span 2' : 'span 1',
              }}
            >
              <h3 className="text-lg font-semibold text-soft-mint mb-4">
                {widget.title}
              </h3>
              {widget.type === 'metric' && (
                <div className="text-4xl font-bold text-white">
                  ${widget.config.value?.toLocaleString()}
                </div>
              )}
              {widget.type === 'line' && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockData}>
                    <defs>
                      <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_sales"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {widget.type === 'bar' && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Bar dataKey="total_sales" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {widget.type === 'pie' && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          ))}

          {dashboard.widgets.length === 0 && (
            <div className="col-span-3 text-center py-12 text-cream glass rounded-xl">
              No widgets added yet. Add widgets to visualize your data.
            </div>
          )}
        </div>

        {showAIAssistant && (
          <AIAssistant dashboardId={dashboardId} />
        )}
      </div>
    </Layout>
  );
}

function AIAssistant({ dashboardId }: { dashboardId: string }) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI assistant. I can help you understand the data on this dashboard. Ask me anything!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AIAssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();

      const assistantMessage: AIAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: AIAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 mt-6">
      <h2 className="text-xl font-bold text-soft-mint mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-400" />
        AI Assistant
      </h2>
      <div className="h-96 overflow-y-auto mb-4 space-y-4 glass-strong rounded-lg p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'glass-active text-white'
                  : 'glass text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user'
                    ? 'text-cream'
                    : 'text-cream'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass text-white rounded-lg p-3 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about the dashboard data..."
          className="flex-1 px-4 py-2 glass rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="glass-strong px-6 py-2 rounded-lg text-white hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
