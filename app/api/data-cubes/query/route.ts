import { NextResponse } from 'next/server';
import { dataCubeService } from '@/lib/services/factory';

export async function POST(request: Request) {
  const { query } = await request.json();
  const result = await dataCubeService.query(query);
  return NextResponse.json(result);
}
