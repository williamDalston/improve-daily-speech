import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// GET /api/user/feed-token - Get or generate user's RSS feed token
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { feedToken: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // If no token exists, generate one
  let feedToken = user.feedToken;
  if (!feedToken) {
    feedToken = randomBytes(32).toString('hex');
    await db.user.update({
      where: { id: session.user.id },
      data: { feedToken },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';
  const feedUrl = `${baseUrl}/api/feed/${feedToken}`;

  return NextResponse.json({ feedToken, feedUrl });
}

// POST /api/user/feed-token - Regenerate feed token (if compromised)
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const feedToken = randomBytes(32).toString('hex');

  await db.user.update({
    where: { id: session.user.id },
    data: { feedToken },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';
  const feedUrl = `${baseUrl}/api/feed/${feedToken}`;

  return NextResponse.json({ feedToken, feedUrl });
}
