import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const baseUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Dynamic episode pages (public share links)
  let episodePages: MetadataRoute.Sitemap = [];

  try {
    const publicEpisodes = await db.episode.findMany({
      where: {
        status: 'READY',
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limit to prevent huge sitemaps
    });

    episodePages = publicEpisodes.map((episode) => ({
      url: `${baseUrl}/e/${episode.id}`,
      lastModified: episode.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Failed to fetch episodes for sitemap:', error);
  }

  return [...staticPages, ...episodePages];
}
