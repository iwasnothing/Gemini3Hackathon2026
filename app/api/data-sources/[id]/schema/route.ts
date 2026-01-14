import { NextResponse } from 'next/server';
import { mockTables } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const tables = mockTables[params.id] || [];
  return NextResponse.json({ tables });
}
