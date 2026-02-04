import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Train Your Mind',
  description: 'Enter any topic and create an audio lesson that sticks. AI-powered learning designed for retention.',
  openGraph: {
    title: 'Train Your Mind - MindCast',
    description: 'Enter any topic and get an audio lesson designed to stick. Start sharpening your mind.',
    images: ['/og-create.png'],
  },
  twitter: {
    title: 'Train Your Mind - MindCast',
    description: 'Enter any topic and get an audio lesson designed to stick.',
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
