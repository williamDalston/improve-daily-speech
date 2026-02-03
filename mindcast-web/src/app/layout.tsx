import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MindCast - Documentary-Style Audio Learning',
  description:
    'Transform any topic into a captivating documentary-style audio episode. AI-powered learning that sticks.',
  keywords: ['learning', 'podcast', 'documentary', 'AI', 'education', 'audio'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-gradient font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
