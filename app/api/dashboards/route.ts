import { NextResponse } from 'next/server';
import { dashboardService } from '@/lib/services/factory';

export async function GET() {
  const dashboards = await dashboardService.getAll();
  return NextResponse.json(dashboards);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newDashboard = await dashboardService.create(body);
  return NextResponse.json(newDashboard, { status: 201 });
}
