import Link from 'next/link';
import { Sparkles, Headphones, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="py-16 text-center md:py-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-body-sm text-brand">
          <Sparkles className="h-4 w-4" />
          AI-Powered Learning
        </div>

        <h1 className="mb-6 text-display-lg text-text-primary md:text-[4rem]">
          Turn Any Topic Into a{' '}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            Documentary
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-body-lg text-text-secondary">
          MindCast transforms any subject into captivating, documentary-style audio
          episodes. Learn like you're watching BBC or PBS — but for your ears.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/create">
            <Button size="lg" className="min-w-[180px]">
              Create Episode
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="outline" size="lg" className="min-w-[180px]">
              Browse Library
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Headphones className="h-6 w-6" />}
            title="Documentary Quality"
            description="Multi-stage AI pipeline with research, dual drafts, and 4 enhancement passes for exceptional content."
          />
          <FeatureCard
            icon={<Brain className="h-6 w-6" />}
            title="Deep Learning"
            description="Content designed to stick. Narrative arcs, thought experiments, and memorable insights."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Any Topic"
            description="From quantum physics to stoic philosophy — enter any subject and get expert-level content."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16">
        <h2 className="mb-12 text-center text-display-sm text-text-primary">
          How It Works
        </h2>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { step: '1', title: 'Enter Topic', desc: 'Type any subject you want to learn about' },
            { step: '2', title: 'AI Pipeline', desc: '6-stage enhancement for documentary quality' },
            { step: '3', title: 'Listen', desc: 'Stream your personalized audio episode' },
            { step: '4', title: 'Reflect', desc: 'Deepen understanding with Sovereign Mind lens' },
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

      {/* CTA */}
      <section className="w-full rounded-3xl bg-brand-gradient p-12 text-center text-white">
        <h2 className="mb-4 text-display-sm">Ready to Learn Differently?</h2>
        <p className="mx-auto mb-8 max-w-xl text-body-lg opacity-90">
          Create your first documentary episode in minutes. No credit card required
          for your first 3 episodes.
        </p>
        <Link href="/create">
          <Button
            size="lg"
            className="bg-white text-brand hover:bg-white/90"
          >
            Get Started Free
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
