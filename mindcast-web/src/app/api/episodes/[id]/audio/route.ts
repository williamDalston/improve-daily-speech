import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/episodes/[id]/audio - Serve episode audio
// If audioUrl is set (Vercel Blob / R2), redirects to it.
// Otherwise, serves from the job's stored base64 with byte-range support.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const episodeId = params.id;

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

    // If we have an external audio URL (Blob / R2), redirect to it.
    // The CDN handles Range requests, caching, and streaming natively.
    if (episode.audioUrl) {
      return NextResponse.redirect(episode.audioUrl);
    }

    // Fallback: serve from stored base64 with Range support
    const audioBase64 = episode.job?.fullAudio;
    if (!audioBase64) {
      return NextResponse.json({ error: 'Audio not available' }, { status: 404 });
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const total = audioBuffer.length;

    // Handle Range requests for seeking / progressive playback
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : total - 1;
        const chunk = audioBuffer.slice(start, end + 1);

        return new NextResponse(chunk, {
          status: 206,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Content-Length': chunk.length.toString(),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': total.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('[Audio] Error serving audio:', error);
    return NextResponse.json(
      { error: 'Failed to load audio' },
      { status: 500 }
    );
  }
}
