import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(request: NextRequest, method: string, body?: any) {
  const userId = request.headers.get('x-user-id') || 'user-1';
  
  const url = `${BACKEND_URL}/api/data-cubes`;
  
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
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyRequest(request as NextRequest, 'POST', body);
}
