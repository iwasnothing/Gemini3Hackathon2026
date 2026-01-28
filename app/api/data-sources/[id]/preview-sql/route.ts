import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id') || 'user-1';
  const sourceId = params.id;

  try {
    const body = await request.json();
    const { sql, maxRows } = body || {};

    if (!sql || typeof sql !== 'string' || sql.trim() === '') {
      return NextResponse.json(
        { error: 'SQL is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const url = `${BACKEND_URL}/api/data-sources/${sourceId}/preview-sql`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        sql,
        max_rows: typeof maxRows === 'number' ? maxRows : 5,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[preview-sql API] Error calling backend preview-sql', {
      sourceId,
      backendUrl: BACKEND_URL,
      error,
    });
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}

