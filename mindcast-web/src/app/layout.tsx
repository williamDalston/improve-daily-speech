import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OrganizationJsonLd, WebApplicationJsonLd } from '@/components/seo/json-ld';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const siteUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';

export const metadata: Metadata = {
  title: {
    default: 'MindCast - AI-Powered Documentary Audio Learning',
    template: '%s | MindCast',
  },
  description:
    'Transform any topic into a captivating documentary-style audio episode. AI-powered learning that sticks. Create, listen, and learn on the go.',
  keywords: [
    'AI learning',
    'podcast generator',
    'documentary audio',
    'AI education',
    'audio learning',
    'personalized learning',
    'AI podcast',
    'educational content',
    'learning platform',
    'text to speech',
  ],
  authors: [{ name: 'MindCast' }],
  creator: 'MindCast',
  publisher: 'MindCast',
  metadataBase: new URL(siteUrl),

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'MindCast',
    title: 'MindCast - AI-Powered Documentary Audio Learning',
    description:
      'Transform any topic into a captivating documentary-style audio episode. AI-powered learning that sticks.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MindCast - Learn anything through documentary-style audio',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'MindCast - AI-Powered Documentary Audio Learning',
    description:
      'Transform any topic into a captivating documentary-style audio episode.',
    images: ['/og-image.png'],
    creator: '@mindcastapp',
  },

  // App Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Manifest for PWA
  manifest: '/manifest.json',

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add your verification codes)
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
      </head>
      <body className="min-h-screen bg-surface-gradient font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
