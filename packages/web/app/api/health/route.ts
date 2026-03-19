import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};

  // Check database
  try {
    const { db } = await import('@/lib/database');
    const result = db.prepare('SELECT COUNT(*) as count FROM queries').get() as { count: number };
    checks.database = `connected (${result.count} queries)`;
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  // Check env vars
  const requiredEnvs = ['ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY'];
  const envStatus = requiredEnvs.map((key) => (process.env[key] ? `${key}: ✓` : `${key}: ✗`));
  checks.env = envStatus.join(', ');

  const latency = Date.now() - start;
  const healthy = checks.database.startsWith('connected');

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
