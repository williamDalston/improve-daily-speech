import Link from 'next/link';
import { Sparkles, Headphones, Brain, Zap, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* Hero */}
      <section className="py-16 text-center md:py-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-body-sm text-brand animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Sparkles className="h-4 w-4" />
          Your Personal Mind Dojo
        </div>

        <h1 className="mb-6 text-display-lg text-text-primary md:text-[4rem] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Sharpen Your Mind{' '}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            On Any Topic
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-body-lg text-text-secondary animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          Turn any subject into an audio lesson that actually sticks.
          Learn while you commute, exercise, or relax — and watch your knowledge grow.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Link href="/create">
            <Button size="lg" className="min-w-[180px]">
              Start Training
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="outline" size="lg" className="min-w-[180px]">
              Your Library
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-6 w-6" />}
            title="Learn Anything"
            description="From quantum physics to philosophy — enter any topic and get a lesson tailored to how you learn."
          />
          <FeatureCard
            icon={<Headphones className="h-6 w-6" />}
            title="Audio That Sticks"
            description="Multi-stage AI creates content designed for retention. Narratives, examples, and insights that stay with you."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Train On The Go"
            description="Turn dead time into growth time. Learn during commutes, workouts, or while doing chores."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16">
        <h2 className="mb-12 text-center text-display-sm text-text-primary">
          Your Training Flow
        </h2>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { step: '1', title: 'Choose Topic', desc: 'Pick anything you want to understand better' },
            { step: '2', title: 'AI Crafts It', desc: '6-stage process for maximum retention' },
            { step: '3', title: 'Listen & Learn', desc: 'Stream your personalized audio lesson' },
            { step: '4', title: 'Go Deeper', desc: 'Reflect and solidify your understanding' },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-border bg-surface p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">
                {item.step}
              </div>
              <h3 className="mb-2 text-heading-sm text-text-primary">{item.title}</h3>
              <p className="text-body-sm text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it works */}
      <section className="w-full py-16">
        <h2 className="mb-12 text-center text-display-sm text-text-primary">
          Why Audio Learning Works
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <Target className="mb-4 h-8 w-8 text-brand" />
            <h3 className="mb-3 text-heading-md text-text-primary">Active Recall</h3>
            <p className="text-body-md text-text-secondary">
              Listening engages your brain differently than reading.
              Our AI structures content to trigger active recall and build lasting connections.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-8">
            <TrendingUp className="mb-4 h-8 w-8 text-brand" />
            <h3 className="mb-3 text-heading-md text-text-primary">Consistent Growth</h3>
            <p className="text-body-md text-text-secondary">
              Small daily sessions compound into massive knowledge gains.
              Track your streak and watch your understanding deepen over time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full rounded-3xl bg-brand-gradient p-12 text-center text-white">
        <h2 className="mb-4 text-display-sm">Ready to Level Up?</h2>
        <p className="mx-auto mb-8 max-w-xl text-body-lg opacity-90">
          Start training your mind today. Your first 3 lessons are free — no credit card needed.
        </p>
        <Link href="/create">
          <Button
            size="lg"
            className="bg-white text-brand hover:bg-white/90"
          >
            Start Learning Free
          </Button>
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-medium">
      <div className="mb-4 inline-flex rounded-xl bg-brand/10 p-3 text-brand">
        {icon}
      </div>
      <h3 className="mb-2 text-heading-md text-text-primary">{title}</h3>
      <p className="text-body-md text-text-secondary">{description}</p>
    </div>
  );
}
