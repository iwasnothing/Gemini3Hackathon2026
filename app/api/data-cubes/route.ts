import { NextResponse } from 'next/server';
import { mockDataCubes } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(mockDataCubes);
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
