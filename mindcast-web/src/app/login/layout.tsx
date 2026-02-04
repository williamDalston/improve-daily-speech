import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to MindCast and start creating AI-powered documentary audio episodes on any topic.',
  openGraph: {
    title: 'Sign In to MindCast',
    description: 'Join thousands learning through documentary-style audio. Sign in with Google to get started.',
    images: ['/og-image.png'],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
