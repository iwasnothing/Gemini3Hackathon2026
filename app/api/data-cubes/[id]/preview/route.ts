import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id') || 'user-1';
  const cubeId = params.id;

  try {
    const body = await request.json().catch(() => ({}));
    const limit = typeof body?.limit === 'number' ? Math.min(500, Math.max(1, body.limit)) : 20;
    const offset = typeof body?.offset === 'number' ? Math.max(0, body.offset) : 0;

    const url = `${BACKEND_URL}/api/data-cubes/${cubeId}/preview`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ limit, offset }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[data-cubes/[id]/preview] Error calling backend:', {
      cubeId,
      backendUrl: BACKEND_URL,
      error,
    });
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
