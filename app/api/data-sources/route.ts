import { NextResponse } from 'next/server';
import { dataSourceService } from '@/lib/services/factory';

export async function GET() {
  const sources = await dataSourceService.getAll();
  return NextResponse.json(sources);
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
