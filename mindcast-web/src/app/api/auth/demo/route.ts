import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const DEMO_EMAIL = 'demo@mindcast.app';
const DEMO_PASSWORD = 'demo-user-password-12345';

/**
 * GET /api/auth/demo - Get or create demo user credentials
 * This allows users to try the app without signing up
 */
export async function GET() {
  try {
    // Check if demo user exists
    let demoUser = await db.user.findUnique({
      where: { email: DEMO_EMAIL },
    });

    if (!demoUser) {
      // Create demo user with pro subscription
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
      demoUser = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: 'Demo User',
          password: hashedPassword,
          subscriptionStatus: 'active', // Pro access
          freeEpisodesUsed: 0,
          onboardingCompleted: true,
        },
      });
    } else {
      // Ensure demo user always has pro status and reset usage
      await db.user.update({
        where: { email: DEMO_EMAIL },
        data: {
          subscriptionStatus: 'active',
          freeEpisodesUsed: 0,
        },
      });
    }

    // Return credentials for client-side sign in
    return NextResponse.json({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  } catch (error) {
    console.error('Demo user error:', error);
    return NextResponse.json(
      { error: 'Failed to setup demo account' },
      { status: 500 }
    );
  }
}
