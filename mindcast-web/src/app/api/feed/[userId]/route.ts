import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/feed/[userId] - RSS feed for user's episodes
// This allows users to subscribe in any podcast app
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  // Get user and their episodes
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only Pro users can have RSS feeds (to encourage upgrades)
  // For MVP, allow all users
  // if (user.subscriptionStatus !== 'active') {
  //   return NextResponse.json({ error: 'RSS feeds require Pro subscription' }, { status: 403 });
  // }

  const episodes = await db.episode.findMany({
    where: {
      userId,
      status: 'READY',
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit to last 50 episodes
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
  const feedUrl = `${baseUrl}/api/feed/${userId}`;
  const userName = user.name || 'MindCast User';

  const rssItems = episodes
    .map((episode) => {
      const title = episode.title || episode.topic;
      const description = episode.transcript
        ? episode.transcript.substring(0, 500) + '...'
        : `Learn about: ${episode.topic}`;
      const duration = episode.audioDurationSecs || 600;
      const pubDate = new Date(episode.createdAt).toUTCString();

      // Audio URL - in production this would be a real URL
      // For now, we'll use the episode page which can serve audio
      const audioUrl = `${baseUrl}/api/episodes/${episode.id}/audio`;

      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${baseUrl}/episode/${episode.id}</link>
      <guid isPermaLink="true">${baseUrl}/episode/${episode.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${audioUrl}" length="${duration * 16000}" type="audio/mpeg"/>
      <itunes:duration>${formatDuration(duration)}</itunes:duration>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`;
    })
    .join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${userName}'s MindCast Episodes]]></title>
    <description><![CDATA[AI-generated documentary-style audio episodes on topics you choose. Learn anything, anywhere.]]></description>
    <link>${baseUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} MindCast</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>${userName}</itunes:author>
    <itunes:summary>AI-generated documentary-style audio episodes on topics you choose.</itunes:summary>
    <itunes:owner>
      <itunes:name>${userName}</itunes:name>
      <itunes:email>${user.email || 'support@mindcast.app'}</itunes:email>
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
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
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
