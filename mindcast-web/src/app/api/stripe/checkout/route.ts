import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, type BillingInterval } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get billing interval from request body
    const body = await request.json().catch(() => ({}));
    const interval: BillingInterval = body.interval === 'year' ? 'year' : 'month';

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email,
      interval
    );
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
