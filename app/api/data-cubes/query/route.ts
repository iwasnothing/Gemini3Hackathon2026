import { NextResponse } from 'next/server';
import { dataCubeService } from '@/lib/services/factory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { query } = body;
    
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({ error: 'Query is required and must be a non-empty string' }, { status: 400 });
    }
    
    const result = await dataCubeService.query(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
  }
}
