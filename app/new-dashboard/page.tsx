'use client';

import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Dashboard, Widget } from '@/lib/types';
import { Send, Loader, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
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

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function NewDashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<Partial<Dashboard> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!hasMessages && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response and dashboard generation
    setTimeout(() => {
      const isFirstMessage = messages.length === 0;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(userMessage.content, isFirstMessage),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Generate or update dashboard preview based on description
      if (isFirstMessage) {
        const generatedDashboard = generateDashboardFromDescription(userMessage.content);
        setDashboard(generatedDashboard);
      } else {
        // For follow-up messages, update the existing dashboard
        const updatedDashboard = updateDashboardFromMessage(userMessage.content, dashboard);
        setDashboard(updatedDashboard);
      }
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string, isFirstMessage: boolean): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (isFirstMessage) {
      if (lowerInput.includes('sales') || lowerInput.includes('revenue')) {
        return "I've created a sales dashboard with revenue trends, monthly breakdowns, and product performance metrics. You can ask me to add more charts, change colors, or modify any aspect of the dashboard.";
      } else if (lowerInput.includes('user') || lowerInput.includes('customer')) {
        return "I've created a user analytics dashboard showing user growth, engagement metrics, and demographic breakdowns. What would you like to adjust?";
      } else if (lowerInput.includes('financial') || lowerInput.includes('finance')) {
        return "I've created a financial dashboard with profit/loss trends, expense breakdowns, and cash flow metrics. Feel free to ask for modifications!";
      } else {
        return "I've created a dashboard based on your description. The canvas on the right shows a preview. You can ask me to add charts, change layouts, modify colors, or adjust any aspect of the dashboard.";
      }
    } else {
      // Follow-up messages
      if (lowerInput.includes('add') || lowerInput.includes('more')) {
        return "I've added a new widget to your dashboard. Check the canvas on the right to see the update!";
      } else if (lowerInput.includes('change') || lowerInput.includes('modify') || lowerInput.includes('update')) {
        return "I've updated the dashboard based on your request. The changes are reflected in the canvas.";
      } else if (lowerInput.includes('color') || lowerInput.includes('theme')) {
        return "I've updated the color scheme of your dashboard. The new colors are now applied to all charts.";
      } else if (lowerInput.includes('remove') || lowerInput.includes('delete')) {
        return "I've removed the requested widget from your dashboard.";
      } else {
        return "I've made the requested changes to your dashboard. Check the canvas to see the updates!";
      }
    }
  };

  const updateDashboardFromMessage = (
    message: string,
    currentDashboard: Partial<Dashboard> | null
  ): Partial<Dashboard> => {
    if (!currentDashboard) {
      return generateDashboardFromDescription(message);
    }

    const lowerMessage = message.toLowerCase();
    const updatedWidgets = [...(currentDashboard.widgets || [])];

    if (lowerMessage.includes('add') || lowerMessage.includes('more')) {
      // Add a new widget
      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type: 'bar',
        title: 'New Chart',
        config: {},
        x: 0,
        y: updatedWidgets.length * 4,
        width: 6,
        height: 4,
      };
      updatedWidgets.push(newWidget);
    } else if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) {
      // Remove the last widget
      if (updatedWidgets.length > 0) {
        updatedWidgets.pop();
      }
    }

    return {
      ...currentDashboard,
      widgets: updatedWidgets,
    };
  };

  const generateDashboardFromDescription = (description: string): Partial<Dashboard> => {
    const lowerDesc = description.toLowerCase();
    
    const widgets: Widget[] = [];
    
    if (lowerDesc.includes('sales') || lowerDesc.includes('revenue')) {
      widgets.push(
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Total Revenue',
          config: { value: 1250000 },
          x: 0,
          y: 0,
          width: 4,
          height: 2,
        },
        {
          id: 'widget-2',
          type: 'line',
          title: 'Revenue Trend',
          config: {},
          x: 4,
          y: 0,
          width: 8,
          height: 4,
        },
        {
          id: 'widget-3',
          type: 'bar',
          title: 'Monthly Sales',
          config: {},
          x: 0,
          y: 2,
          width: 6,
          height: 4,
        },
        {
          id: 'widget-4',
          type: 'pie',
          title: 'Product Distribution',
          config: {},
          x: 6,
          y: 2,
          width: 6,
          height: 4,
        }
      );
    } else if (lowerDesc.includes('user') || lowerDesc.includes('customer')) {
      widgets.push(
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Total Users',
          config: { value: 45230 },
          x: 0,
          y: 0,
          width: 4,
          height: 2,
        },
        {
          id: 'widget-2',
          type: 'line',
          title: 'User Growth',
          config: {},
          x: 4,
          y: 0,
          width: 8,
          height: 4,
        },
        {
          id: 'widget-3',
          type: 'bar',
          title: 'Active Users by Region',
          config: {},
          x: 0,
          y: 2,
          width: 12,
          height: 4,
        }
      );
    } else {
      // Default dashboard
      widgets.push(
        {
          id: 'widget-1',
          type: 'metric',
          title: 'Key Metric',
          config: { value: 10000 },
          x: 0,
          y: 0,
          width: 4,
          height: 2,
        },
        {
          id: 'widget-2',
          type: 'line',
          title: 'Trend Analysis',
          config: {},
          x: 4,
          y: 0,
          width: 8,
          height: 4,
        },
        {
          id: 'widget-3',
          type: 'bar',
          title: 'Category Breakdown',
          config: {},
          x: 0,
          y: 2,
          width: 6,
          height: 4,
        },
        {
          id: 'widget-4',
          type: 'pie',
          title: 'Distribution',
          config: {},
          x: 6,
          y: 2,
          width: 6,
          height: 4,
        }
      );
    }

    return {
      name: 'New Dashboard',
      description: description,
      widgets,
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mock data for charts
  const mockData = [
    { month: 'Jan', value: 125000 },
    { month: 'Feb', value: 142000 },
    { month: 'Mar', value: 138000 },
    { month: 'Apr', value: 155000 },
    { month: 'May', value: 148000 },
    { month: 'Jun', value: 162000 },
  ];

  const pieData = [
    { name: 'Category A', value: 400 },
    { name: 'Category B', value: 300 },
    { name: 'Category C', value: 200 },
    { name: 'Category D', value: 100 },
  ];

  return (
    <Layout>
      <div className="h-full flex flex-col p-6">
        {!hasMessages ? (
          // Centered chat interface (initial state)
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl px-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-strong mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Create Your Dashboard
                </h1>
                <p className="text-gray-300 text-lg">
                  Describe what you'd like to visualize and I'll build it for you
                </p>
              </div>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Create a sales dashboard with revenue trends and monthly breakdowns..."
                  className="w-full px-6 py-4 pr-14 text-lg text-white glass rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  rows={4}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 bottom-3 p-2 glass-strong text-white rounded-xl hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Split view: Chat left, Canvas right
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Chat Panel - Left */}
            <div className="w-96 flex flex-col glass rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Chat Assistant
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'glass-active text-white'
                          : 'glass text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="glass rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin text-blue-400" />
                        <span className="text-sm text-white">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me to modify the dashboard..."
                    className="w-full px-4 py-3 pr-12 text-sm glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                    rows={2}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-2 glass-strong text-white rounded-lg hover:glass-active disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Panel - Right */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6 glass rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {dashboard?.name || 'Dashboard Preview'}
                  </h2>
                  <p className="text-gray-300">
                    {dashboard?.description || 'Your dashboard will appear here'}
                  </p>
                </div>
                {dashboard?.widgets && dashboard.widgets.length > 0 ? (
                  <div className="grid grid-cols-12 gap-4">
                    {dashboard.widgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="glass rounded-xl p-6 hover:glass-strong transition-all"
                        style={{
                          gridColumn: `span ${widget.width}`,
                          gridRow: `span ${widget.height}`,
                        }}
                      >
                        <h3 className="text-lg font-semibold text-white mb-4">
                          {widget.title}
                        </h3>
                        {widget.type === 'metric' && (
                          <div className="text-4xl font-bold text-white">
                            {typeof widget.config.value === 'number'
                              ? `$${widget.config.value.toLocaleString()}`
                              : widget.config.value}
                          </div>
                        )}
                        {widget.type === 'line' && (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={mockData}>
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
                              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                              <Line
                                type="monotone"
                                dataKey="value"
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
                              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                              <Bar dataKey="value" fill="#6366f1" />
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
                        {widget.type === 'table' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-2 px-4 text-white">Column 1</th>
                                  <th className="text-left py-2 px-4 text-white">Column 2</th>
                                  <th className="text-left py-2 px-4 text-white">Column 3</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <tr key={i} className="border-b border-white/10">
                                    <td className="py-2 px-4 text-gray-300">Row {i} Col 1</td>
                                    <td className="py-2 px-4 text-gray-300">Row {i} Col 2</td>
                                    <td className="py-2 px-4 text-gray-300">Row {i} Col 3</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Waiting for dashboard description...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
