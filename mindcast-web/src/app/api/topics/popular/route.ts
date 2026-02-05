import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/topics/popular - List canon topics available for instant generation
export async function GET() {
  const topics = await db.topic.findMany({
    where: {
      status: 'CANON',
      canonEpisodeId: { not: null },
    },
    orderBy: { requestCount: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      requestCount: true,
      uniqueUsers: true,
    },
  });

  return NextResponse.json({ topics });
}
