import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Library',
  description: 'Your personal collection of AI-generated documentary audio episodes. Listen, organize, and continue learning.',
  robots: {
    index: false, // Private content, don't index
    follow: false,
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
