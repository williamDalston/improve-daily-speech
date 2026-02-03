import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const portalUrl = await createPortalSession(session.user.id);
    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
