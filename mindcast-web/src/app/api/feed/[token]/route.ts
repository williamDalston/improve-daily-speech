import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/feed/[token] - RSS feed for user's episodes
// Uses secure token instead of userId for privacy
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token || token.length < 32) {
    return NextResponse.json({ error: 'Invalid feed token' }, { status: 401 });
  }

  // Find user by feed token
  const user = await db.user.findUnique({
    where: { feedToken: token },
    select: {
      id: true,
      name: true,
      image: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
  }

  const episodes = await db.episode.findMany({
    where: {
      userId: user.id,
      status: 'READY',
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      topic: true,
      transcript: true,
      audioUrl: true,
      audioDurationSecs: true,
      createdAt: true,
      wordCount: true,
    },
  });

  // Build RSS feed
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';
  const feedUrl = `${baseUrl}/api/feed/${token}`;
  const userName = user.name || 'MindCast Listener';

  const rssItems = episodes
    .map((episode) => {
      const title = episode.title || episode.topic;
      const description = episode.transcript
        ? episode.transcript.substring(0, 500) + '...'
        : `Learn about: ${episode.topic}`;
      const duration = episode.audioDurationSecs || 600;
      const pubDate = new Date(episode.createdAt).toUTCString();
      const audioUrl = `${baseUrl}/api/episodes/${episode.id}/audio`;

      return `
    <item>
      <title><![CDATA[${escapeXml(title)}]]></title>
      <description><![CDATA[${escapeXml(description)}]]></description>
      <link>${baseUrl}/episode/${episode.id}</link>
      <guid isPermaLink="true">${baseUrl}/episode/${episode.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${audioUrl}" length="${duration * 16000}" type="audio/mpeg"/>
      <itunes:duration>${formatDuration(duration)}</itunes:duration>
      <itunes:summary><![CDATA[${escapeXml(description)}]]></itunes:summary>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`;
    })
    .join('\n');

  // RSS feed - no email exposed, uses generic support email
  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${escapeXml(userName)}'s MindCast]]></title>
    <description><![CDATA[AI-generated documentary-style audio episodes. Learn anything, anywhere.]]></description>
    <link>${baseUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} MindCast</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>MindCast</itunes:author>
    <itunes:summary>AI-generated documentary-style audio episodes.</itunes:summary>
    <itunes:owner>
      <itunes:name>MindCast</itunes:name>
      <itunes:email>support@mindcast.app</itunes:email>
    </itunes:owner>
    <itunes:image href="${user.image || `${baseUrl}/podcast-cover.png`}"/>
    <itunes:category text="Education">
      <itunes:category text="Self-Improvement"/>
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
