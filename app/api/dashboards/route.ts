import { NextResponse } from 'next/server';
import { mockDashboards } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(mockDashboards);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newDashboard = {
    id: `dash-${Date.now()}`,
    ...body,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(newDashboard, { status: 201 });
}
