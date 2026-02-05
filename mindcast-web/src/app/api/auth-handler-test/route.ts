import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Block in production — debug endpoint only
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  try {
    // Import auth module
    const authModule = await import('@/lib/auth');
    checks.authImport = 'OK';
    checks.exports = Object.keys(authModule);

    // Check handlers
    const { handlers, GET: handlerGet } = authModule;
    checks.handlersExists = !!handlers;
    checks.handlerGetExists = !!handlerGet;

    // Try to manually call the GET handler
    if (handlerGet) {
      try {
        // Create a mock request for /api/auth/providers
        const url = new URL('/api/auth/providers', request.url);
        const mockRequest = new NextRequest(url, {
          method: 'GET',
        });

        checks.mockRequestUrl = mockRequest.url;

        const response = await handlerGet(mockRequest);
        checks.handlerResponse = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        };

        // Try to get response body
        try {
          const body = await response.text();
          checks.responseBody = body.substring(0, 500);
        } catch (bodyError) {
          checks.bodyError = bodyError instanceof Error ? bodyError.message : 'Unknown';
        }
      } catch (handlerError) {
        checks.handlerCallError = handlerError instanceof Error ? handlerError.message : 'Unknown';
        checks.handlerCallStack = handlerError instanceof Error
          ? handlerError.stack?.split('\n').slice(0, 8)
          : undefined;
      }
    }
  } catch (error) {
    checks.importError = error instanceof Error ? error.message : 'Unknown';
    checks.importStack = error instanceof Error
      ? error.stack?.split('\n').slice(0, 8)
      : undefined;
  }

  return NextResponse.json(checks);
}
