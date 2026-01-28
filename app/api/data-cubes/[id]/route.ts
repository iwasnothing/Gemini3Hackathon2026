import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id') || 'user-1';
  const cubeId = params.id;

  const url = `${BACKEND_URL}/api/data-cubes/${cubeId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    });

    // For 204, there is no body
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[data-cubes/[id]] Error proxying DELETE to backend:', {
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

