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
      select: { id: true, email: true, password: true },
    });

    if (!demoUser) {
      // Create demo user with pro subscription
      console.log('[Demo] Creating new demo user...');
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
      demoUser = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: 'Demo User',
          password: hashedPassword,
          subscriptionStatus: 'active',
          freeEpisodesUsed: 0,
          onboardingCompleted: true,
        },
        select: { id: true, email: true, password: true },
      });
      console.log('[Demo] User created:', demoUser.id);
    } else {
      // Update demo user - ensure pro status and password is set
      console.log('[Demo] Updating existing user:', demoUser.id);

      const updateData: Record<string, unknown> = {
        subscriptionStatus: 'active',
        freeEpisodesUsed: 0,
        onboardingCompleted: true,
      };

      // Hash and set password if not already set
      if (!demoUser.password) {
        console.log('[Demo] Setting password for existing user');
        updateData.password = await bcrypt.hash(DEMO_PASSWORD, 12);
      }

      await db.user.update({
        where: { email: DEMO_EMAIL },
        data: updateData,
      });
      console.log('[Demo] User updated');
    }

    // Return credentials for client-side sign in
    return NextResponse.json({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  } catch (error) {
    console.error('[Demo] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to setup demo account',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
