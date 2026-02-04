import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Episode',
  description: 'Transform any topic into an engaging documentary-style audio episode with AI. Research, writing, and narration - all automated.',
  openGraph: {
    title: 'Create Your MindCast Episode',
    description: 'Enter any topic and get a professionally crafted documentary-style audio episode in minutes.',
    images: ['/og-create.png'],
  },
  twitter: {
    title: 'Create Your MindCast Episode',
    description: 'Enter any topic and get a professionally crafted documentary-style audio episode in minutes.',
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
