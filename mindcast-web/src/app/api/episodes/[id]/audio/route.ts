import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/episodes/[id]/audio - Serve episode audio
// In production, this would redirect to S3/R2
// For now, it serves from the job's stored base64 audio
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const episodeId = params.id;

  // Find the episode and its associated job (which has the audio)
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    select: {
      id: true,
      status: true,
      audioUrl: true,
      job: {
        select: {
          fullAudio: true,
        },
      },
    },
  });

  if (!episode) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }

  if (episode.status !== 'READY') {
    return NextResponse.json({ error: 'Episode not ready' }, { status: 400 });
  }

  // If we have an external audio URL (S3/R2), redirect to it
  if (episode.audioUrl) {
    return NextResponse.redirect(episode.audioUrl);
  }

  // Otherwise, serve from stored base64
  const audioBase64 = episode.job?.fullAudio;
  if (!audioBase64) {
    return NextResponse.json({ error: 'Audio not available' }, { status: 404 });
  }

  // Convert base64 to buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year (audio doesn't change)
    },
  });
}
