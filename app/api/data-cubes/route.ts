import { NextRequest, NextResponse } from 'next/server';
import { mockDataCubes } from '@/lib/mockData';
import { filterDataCubesByEntitlements, getUserFromRequest } from '@/lib/utils/entitlements';

export async function GET(request: NextRequest) {
  const userId = getUserFromRequest(request);
  const filteredCubes = filterDataCubesByEntitlements(mockDataCubes, userId);
  return NextResponse.json(filteredCubes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCube = {
    id: `cube-${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
    data: [],
  };
  return NextResponse.json(newCube, { status: 201 });
}
