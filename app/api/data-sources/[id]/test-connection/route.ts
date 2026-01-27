import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id') || 'user-1';
  const sourceId = params.id;
  
  const url = `${BACKEND_URL}/api/data-sources/${sourceId}/test-connection`;
  
  try {
    console.log('[test-connection API] Forwarding request to backend', {
      backendUrl: BACKEND_URL,
      url,
      sourceId,
      userId,
      method: 'POST',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });
    
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('[test-connection API] Failed to parse backend JSON response', {
        sourceId,
        status: response.status,
        rawBody: text,
        error: e instanceof Error ? e.message : String(e),
      });
      data = {
        success: false,
        message: 'Backend returned non-JSON response for test-connection',
        rawBody: text,
      };
    }

    console.log('[test-connection API] Backend response for test-connection', {
      sourceId,
      status: response.status,
      success: data?.success,
      message: data?.message,
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[test-connection API] Error calling backend test-connection', {
      sourceId,
      backendUrl: BACKEND_URL,
      url,
      error,
    });
    return NextResponse.json(
      { success: false, message: 'Failed to connect to backend', status: 'error' },
      { status: 500 }
    );
  }
}
