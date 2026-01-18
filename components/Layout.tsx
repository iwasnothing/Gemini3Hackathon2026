'use client';

import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullHeight = pathname === '/new-dashboard';
  
  return (
    <div className={`flex ${isFullHeight ? 'h-screen' : 'min-h-screen'} bg-gray-50 ${isFullHeight ? 'overflow-hidden' : ''}`}>
      <Sidebar />
      <main className={`flex-1 ${isFullHeight ? 'overflow-hidden' : 'p-8'}`}>{children}</main>
    </div>
  );
}
