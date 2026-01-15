import { NextResponse } from 'next/server';
import { dataSourceService } from '@/lib/services/factory';

export async function GET() {
  const sources = await dataSourceService.getAll();
  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newSource = await dataSourceService.create(body);
  return NextResponse.json(newSource, { status: 201 });
}
