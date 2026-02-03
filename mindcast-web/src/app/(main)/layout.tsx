import { Navbar } from '@/components/navbar';
import { Providers } from '@/components/providers';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </Providers>
  );
}
