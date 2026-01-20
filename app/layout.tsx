import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext'

export const metadata: Metadata = {
  title: 'Insight Canvas - AI-Assisted Self-Served BI Dashboard',
  description: 'Configure data sources, create AI Semitic Data Layers with metadata, and build interactive dashboards with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
