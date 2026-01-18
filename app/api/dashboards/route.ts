import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/lib/services/factory';
import { filterDashboardsByEntitlements, getUserFromRequest } from '@/lib/utils/entitlements';

export async function GET(request: NextRequest) {
  const userId = getUserFromRequest(request);
  const allDashboards = await dashboardService.getAll();
  const filteredDashboards = filterDashboardsByEntitlements(allDashboards, userId);
  return NextResponse.json(filteredDashboards);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newDashboard = await dashboardService.create(body);
  return NextResponse.json(newDashboard, { status: 201 });
}
