import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/debug - Debug endpoint to check database connection
 * Remove this in production!
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    // Database
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    // Auth - check if these are set (don't reveal values)
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  try {
    // Test database connection
    const userCount = await db.user.count();
    checks.dbConnection = 'OK';
    checks.userCount = userCount;

    // Check if demo user exists
    const demoUser = await db.user.findUnique({
      where: { email: 'demo@mindcast.app' },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        onboardingCompleted: true,
      },
    });
    checks.demoUser = demoUser ? {
      exists: true,
      id: demoUser.id,
      status: demoUser.subscriptionStatus,
      onboarded: demoUser.onboardingCompleted,
    } : { exists: false };

    // Check schema by trying to select password field
    try {
      const userWithPassword = await db.user.findFirst({
        select: { password: true },
        take: 1,
      });
      checks.passwordFieldExists = true;
    } catch (e) {
      checks.passwordFieldExists = false;
      checks.passwordFieldError = e instanceof Error ? e.message : 'Unknown';
    }

  } catch (error) {
    checks.dbConnection = 'FAILED';
    checks.dbError = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(checks);
}
