'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, LayoutDashboard, Box, Settings, Home } from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Data Sources', href: '/data-sources', icon: Database },
  { name: 'Data Cubes', href: '/data-cubes', icon: Box },
  { name: 'Dashboards', href: '/dashboards', icon: LayoutDashboard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-400">Insight Canvas</h1>
        <p className="text-sm text-gray-400 mt-1">AI-Assisted BI</p>
      </div>
      <nav className="space-y-2">
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
    </div>
  );
}
