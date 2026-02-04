import { Navbar } from '@/components/navbar';
import { Providers } from '@/components/providers';
import { OnboardingProvider } from '@/components/onboarding-provider';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check onboarding status server-side
  let onboardingCompleted = true;
  const session = await auth();

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    });
    onboardingCompleted = user?.onboardingCompleted ?? false;
  }

  return (
    <Providers>
      <OnboardingProvider initialOnboardingCompleted={onboardingCompleted}>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </OnboardingProvider>
    </Providers>
  );
}
