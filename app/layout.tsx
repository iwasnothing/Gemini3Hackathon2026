import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Insight Canvas - AI-Assisted Self-Served BI Dashboard',
  description: 'Configure data sources, create data cubes, and build interactive dashboards with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
