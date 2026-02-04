'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { OnboardingModal } from './onboarding-modal';

interface OnboardingProviderProps {
  children: React.ReactNode;
  initialOnboardingCompleted?: boolean;
}

export function OnboardingProvider({
  children,
  initialOnboardingCompleted = true,
}: OnboardingProviderProps) {
  const { data: session } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding if user is logged in and hasn't completed it
    if (session?.user && !initialOnboardingCompleted) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session, initialOnboardingCompleted]);

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingModal
          userName={session?.user?.name}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
