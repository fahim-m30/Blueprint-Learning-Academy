import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RENDER_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'https://blueprint-learning-academy-e6hc.onrender.com';

/**
 * Public Keep-Alive Ping Service for Render Backend
 * Triggers an external HTTPS request from Vercel's global network to keep Render awake.
 */
export async function GET() {
  const startTime = Date.now();
  const pingResults: any = {
    timestamp: new Date().toISOString(),
    backendUrl: RENDER_BACKEND_URL,
  };

  try {
    const res = await fetch(`${RENDER_BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Cron-KeepAlive/2.0',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json().catch(() => ({}));
    pingResults.health = {
      status: res.status,
      ok: res.ok,
      data,
    };
  } catch (err: any) {
    pingResults.health = {
      ok: false,
      error: err.message,
    };
  }

  pingResults.durationMs = Date.now() - startTime;
  return NextResponse.json(pingResults, {
    status: pingResults.health?.ok ? 200 : 503,
  });
}
