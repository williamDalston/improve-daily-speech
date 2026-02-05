import { NextRequest, NextResponse } from 'next/server';
import { processQueuedCanonJobs } from '@/lib/canon/remaster-processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — remastering is heavy

/**
 * GET /api/cron/canon-remaster
 *
 * Process queued CanonJobs (remaster pipeline + TTS + upload).
 * Protected by CRON_SECRET — called by Vercel Cron (every 6 hours, offset from evaluate).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processQueuedCanonJobs();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error('[Canon Remaster Cron] Failed:', error);
    return NextResponse.json(
      { error: 'Remaster processing failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
