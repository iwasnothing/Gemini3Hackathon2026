'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, LayoutDashboard, Box, Settings, Home, Store, Shield, User, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '@/contexts/UserContext';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'New Dashboard', href: '/new-dashboard', icon: Sparkles },
  { name: 'Data Sources', href: '/data-sources', icon: Database },
  { name: 'AI Semitic Data Layer', href: '/data-cubes', icon: Box },
  { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
  { name: 'Data Marketplace', href: '/data-marketplace', icon: Store },
  { name: 'Data Entitlement', href: '/data-entitlement', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-400">Insight Canvas</h1>
        <p className="text-sm text-gray-400 mt-1">AI-Assisted BI</p>
      </div>
      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 px-4 py-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{user.name}</div>
              <div className="text-gray-400 text-xs truncate">{user.email}</div>
              <div className="text-gray-500 text-xs mt-1">Role: {user.role}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
