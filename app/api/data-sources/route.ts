import { NextResponse } from 'next/server';
import { mockDataSources } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(mockDataSources);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newSource = {
    id: `ds-${Date.now()}`,
    ...body,
    status: 'connected' as const,
    lastSync: new Date().toISOString(),
  };
  return NextResponse.json(newSource, { status: 201 });
}
