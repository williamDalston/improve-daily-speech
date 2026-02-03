/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server actions for AI pipeline
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For audio uploads
    },
  },

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile pics
      },
    ],
  },

  // Headers for audio streaming
  async headers() {
    return [
      {
        source: '/api/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
