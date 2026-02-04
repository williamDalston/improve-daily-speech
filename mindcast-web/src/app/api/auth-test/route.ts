import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  try {
    // Try to import auth
    const { auth, handlers } = await import('@/lib/auth');
    checks.authImport = 'OK';
    checks.authType = typeof auth;
    checks.handlersType = typeof handlers;
    checks.hasGet = typeof handlers?.GET;
    checks.hasPost = typeof handlers?.POST;

    // Try calling auth()
    try {
      const session = await auth();
      checks.authCallResult = session ? 'has session' : 'no session';
    } catch (authError) {
      checks.authCallError = authError instanceof Error ? authError.message : 'Unknown';
    }
  } catch (error) {
    checks.authImport = 'FAILED';
    checks.authError = error instanceof Error ? error.message : 'Unknown';
    checks.authStack = error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined;
  }

  return NextResponse.json(checks);
}
