import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(request: NextRequest, method: string, sourceId: string, body?: any) {
  const userId = request.headers.get('x-user-id') || 'user-1';
  
  const url = `${BACKEND_URL}/api/data-sources/${sourceId}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (method === 'DELETE') {
      // DELETE returns 204 No Content
      if (response.status === 204) {
        return new NextResponse(null, { status: 204 });
      }
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  return proxyRequest(request, 'PUT', params.id, body);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyRequest(request, 'DELETE', params.id);
}
