import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  console.log('[API Route] GET /api/data-marketplace called');
  
  try {
    const userId = request.headers.get('x-user-id') || 'user-1';
    console.log('[API Route] User ID:', userId);
    
    const url = `${BACKEND_URL}/api/data-marketplace`;
    console.log('[API Route] Proxying to backend URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      cache: 'no-store', // Ensure fresh request
    });
    
    console.log('[API Route] Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Route] Backend error response:', errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[API Route] Backend data received:', {
      dataSources: data.dataSources?.length || 0,
      dataCubes: data.dataCubes?.length || 0,
      dashboards: data.dashboards?.length || 0,
    });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Route] Error proxying to backend:', error);
    console.error('[API Route] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      backendUrl: BACKEND_URL,
    });
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend',
        details: error instanceof Error ? error.message : String(error),
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    );
  }
}
