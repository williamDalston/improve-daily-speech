'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BillingInterval = 'month' | 'year';

const FEATURES = {
  free: [
    '3 episodes total',
    'Full AI pipeline',
    'Audio playback',
    'Transcript export',
  ],
  pro: [
    'Unlimited episodes',
    'Full AI pipeline (4 enhancement stages)',
    'Sovereign Mind reflection lens',
    'Priority audio generation',
    'All export formats',
    'Learning add-ons (quiz, journal, takeaways)',
    'RSS podcast feed',
    'Sources & citations',
  ],
};

const PRICING = {
  month: {
    price: 19.99,
    label: '/month',
    equivalent: null,
    savings: null,
  },
  year: {
    price: 149.99,
    label: '/year',
    equivalent: 12.50,
    savings: 90,
  },
};

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');

  const handleUpgrade = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billingInterval }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      setIsLoading(false);
    }
  };

  const isPro = session?.user?.isPro;

  const currentPricing = PRICING[billingInterval];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="mb-2 text-display-sm text-text-primary">
          Choose Your Plan
        </h1>
        <p className="text-body-md text-text-secondary">
          Unlock unlimited documentary-style learning
        </p>
      </div>

      {/* Billing Interval Toggle */}
      {!isPro && (
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-full bg-surface-secondary p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={cn(
                'rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
                billingInterval === 'month'
                  ? 'bg-surface-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={cn(
                'relative rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
                billingInterval === 'year'
                  ? 'bg-surface-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Annual
              <span className="absolute -right-2 -top-2 rounded-full bg-success px-2 py-0.5 text-caption font-medium text-white">
                Save $90
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card className={cn(!isPro && 'ring-2 ring-border')}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free
              {!isPro && <Badge variant="secondary">Current</Badge>}
            </CardTitle>
            <CardDescription>Try MindCast for free</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-display-md text-text-primary">
              $0
              <span className="text-body-md text-text-muted">/forever</span>
            </div>
            <ul className="space-y-3">
              {FEATURES.free.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-body-sm">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            {!isPro && (
              <Button variant="outline" disabled className="w-full">
                Current Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={cn(isPro ? 'ring-2 ring-brand' : 'ring-2 ring-brand')}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" />
                Pro
              </span>
              {isPro ? (
                <Badge variant="default">Current</Badge>
              ) : (
                <Badge variant="default">Recommended</Badge>
              )}
            </CardTitle>
            <CardDescription>Unlimited learning power</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-display-md text-text-primary">
                ${currentPricing.price}
                <span className="text-body-md text-text-muted">{currentPricing.label}</span>
              </div>
              {currentPricing.equivalent && (
                <p className="mt-1 text-body-sm text-text-secondary">
                  Just ${currentPricing.equivalent}/month
                  <span className="ml-2 text-success font-medium">
                    (Save ${currentPricing.savings}/year)
                  </span>
                </p>
              )}
            </div>
            <ul className="space-y-3">
              {FEATURES.pro.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-body-sm">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Manage Billing'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-caption text-text-muted">
        Cancel anytime. No questions asked.
      </p>
    </div>
  );
}
