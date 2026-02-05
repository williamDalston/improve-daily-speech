import { NextRequest, NextResponse } from 'next/server';
import { evaluateAllCandidates } from '@/lib/canon/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/canon-evaluate
 *
 * Batch-evaluate all CANDIDATE topics for canon promotion.
 * Protected by CRON_SECRET — called by Vercel Cron (every 6 hours).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await evaluateAllCandidates();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error('[Canon Cron] Evaluation failed:', error);
    return NextResponse.json(
      { error: 'Evaluation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
