import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/jobs/[id] - Get job status with optional long-polling
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = params.id;

  // Optional: long-polling support via ?wait=true&lastStatus=RESEARCH
  const searchParams = request.nextUrl.searchParams;
  const shouldWait = searchParams.get('wait') === 'true';
  const lastStatus = searchParams.get('lastStatus');
  const maxWaitMs = 25000; // 25 seconds max wait (leave buffer for Vercel's 30s limit)

  const getJob = async () => {
    return db.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        topic: true,
        length: true,
        status: true,
        currentStep: true,
        progress: true,
        footprints: true,
        error: true,
        quickHook: true,
        previewAudio: true,
        fullAudio: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        episodeId: true,
      },
    });
  };

  let job = await getJob();

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Security: ensure user owns this job
  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Long-polling: wait for status change
  if (shouldWait && lastStatus && job.status === lastStatus) {
    const startTime = Date.now();
    const pollInterval = 1000; // Check every second

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      job = await getJob();

      if (!job || job.status !== lastStatus) {
        break;
      }
    }
  }

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Format response based on status
  const response: Record<string, unknown> = {
    id: job.id,
    topic: job.topic,
    length: job.length,
    status: job.status,
    currentStep: job.currentStep,
    progress: job.progress,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };

  // Include quick hook if available
  if (job.quickHook) {
    response.quickHook = job.quickHook;
  }

  // Include footprints for transparency
  if (job.footprints) {
    response.footprints = job.footprints;
  }

  // Include preview audio if available
  if (job.previewAudio) {
    response.previewAudio = `data:audio/mp3;base64,${job.previewAudio}`;
  }

  // Include error if failed
  if (job.status === 'FAILED' && job.error) {
    response.error = job.error;
  }

  // Include full result if complete
  if (job.status === 'COMPLETE') {
    response.episodeId = job.episodeId;
    if (job.fullAudio) {
      response.audio = `data:audio/mp3;base64,${job.fullAudio}`;
    }
  }

  return NextResponse.json(response);
}

// DELETE /api/jobs/[id] - Cancel a job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = params.id;

  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { userId: true, status: true },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Can only cancel jobs that are still processing
  const cancelableStatuses = ['PENDING', 'RESEARCH', 'DRAFTING', 'JUDGING', 'ENHANCING', 'AUDIO'];
  if (!cancelableStatuses.includes(job.status)) {
    return NextResponse.json(
      { error: 'Job cannot be cancelled in current state' },
      { status: 400 }
    );
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      error: 'Cancelled by user',
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ message: 'Job cancelled' });
}
