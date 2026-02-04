import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/feedback - Submit content feedback
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { episodeId, type, details, timestamp } = await request.json();

    if (!episodeId || !type) {
      return NextResponse.json(
        { error: 'Episode ID and feedback type are required' },
        { status: 400 }
      );
    }

    // Verify episode exists and belongs to user (or is public)
    const episode = await db.episode.findFirst({
      where: {
        id: episodeId,
        // Allow feedback on own episodes or public episodes
        OR: [
          { userId: session.user.id },
          // Add public episodes check when implemented
        ],
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    // For now, we'll log the feedback. In production, store in a Feedback model
    console.log('Content feedback received:', {
      userId: session.user.id,
      episodeId,
      type,
      details,
      timestamp,
    });

    // TODO: Store feedback in database when Feedback model is added
    // await db.feedback.create({
    //   data: {
    //     userId: session.user.id,
    //     episodeId,
    //     type,
    //     details,
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
