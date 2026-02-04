import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  try {
    // Try to import auth
    const { auth } = await import('@/lib/auth');
    checks.authImport = 'OK';
    checks.authType = typeof auth;
  } catch (error) {
    checks.authImport = 'FAILED';
    checks.authError = error instanceof Error ? error.message : 'Unknown';
    checks.authStack = error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined;
  }

  return NextResponse.json(checks);
}
