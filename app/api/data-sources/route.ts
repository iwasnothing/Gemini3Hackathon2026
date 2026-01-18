import { NextRequest, NextResponse } from 'next/server';
import { dataSourceService } from '@/lib/services/factory';
import { filterDataSourcesByEntitlements, getUserFromRequest } from '@/lib/utils/entitlements';

export async function GET(request: NextRequest) {
  const userId = getUserFromRequest(request);
  const allSources = await dataSourceService.getAll();
  const filteredSources = filterDataSourcesByEntitlements(allSources, userId);
  return NextResponse.json(filteredSources);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSource = await dataSourceService.create(body);
    return NextResponse.json(newSource, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 });
  }
}
