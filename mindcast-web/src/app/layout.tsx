import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OrganizationJsonLd, WebApplicationJsonLd } from '@/components/seo/json-ld';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const siteUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';

export const metadata: Metadata = {
  title: {
    default: 'MindCast - Sharpen Your Mind with AI',
    template: '%s | MindCast',
  },
  description:
    'Your personal mind dojo. Turn any topic into an audio lesson that sticks. Train your brain on the go with AI-powered learning.',
  keywords: [
    'AI learning',
    'audio learning',
    'mind training',
    'learn anything',
    'AI education',
    'personalized learning',
    'brain training',
    'educational audio',
    'learning platform',
    'self improvement',
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
    title: 'MindCast - Sharpen Your Mind with AI',
    description:
      'Your personal mind dojo. Turn any topic into an audio lesson that sticks. Train your brain on the go.',
  },

  // Twitter Card
  twitter: {
    card: 'summary',
    title: 'MindCast - Sharpen Your Mind with AI',
    description:
      'Your personal mind dojo. Turn any topic into an audio lesson that sticks.',
    creator: '@mindcastapp',
  },

  // App Icons
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },

  // Apple PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MindCast',
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
