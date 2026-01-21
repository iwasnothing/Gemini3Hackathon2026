'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, LayoutDashboard, Box, Settings, Home, Store, Shield, User, Sparkles, BarChart3, FileText, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '@/contexts/UserContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'New Dashboard', href: '/new-dashboard', icon: Sparkles },
  { name: 'Analytics', href: '/dashboards', icon: BarChart3 },
  { name: 'Reports', href: '/data-cubes', icon: FileText },
  { name: 'Settings', href: '/data-sources', icon: Settings },
  { name: 'Data Marketplace', href: '/data-marketplace', icon: Store },
  { name: 'Data Entitlement', href: '/data-entitlement', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="w-64 glass min-h-screen p-6 flex flex-col relative z-10">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center border border-white/30">
          <span className="text-xl font-bold text-white">S</span>
        </div>
        <span className="text-lg font-semibold text-white">SaaS Co.</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative',
                isActive
                  ? 'glass-active text-white'
                  : 'text-gray-300 hover:glass-strong hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full" />
              )}
              <Icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-gray-300')} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300">
          <LogOut className="w-4 h-4" />
          <span>SaaS Co.</span>
        </div>
      </div>
    </div>
  );
}
