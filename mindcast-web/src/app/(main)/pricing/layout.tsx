import { Metadata } from 'next';
import { ProductJsonLd, FAQJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Pricing - MindCast Pro',
  description: 'Unlock unlimited AI-powered documentary audio episodes with MindCast Pro. Start free, upgrade anytime. Cancel with one click.',
  openGraph: {
    title: 'MindCast Pro Pricing',
    description: 'Unlimited documentary-style learning. Start free, upgrade for $9.99/month.',
    images: ['/og-pricing.png'],
  },
  twitter: {
    title: 'MindCast Pro Pricing',
    description: 'Unlimited documentary-style learning. Start free, upgrade for $9.99/month.',
  },
};

const pricingFAQs = [
  {
    question: 'How many episodes can I create for free?',
    answer: 'Free users can create up to 3 episodes with the full AI pipeline, including research, drafting, and audio generation.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! You can cancel your MindCast Pro subscription at any time with one click. No questions asked.',
  },
  {
    question: 'What\'s included in MindCast Pro?',
    answer: 'MindCast Pro includes unlimited episodes, priority audio generation, all export formats, learning add-ons (quiz, journal, takeaways), RSS podcast feed, and sources with citations.',
  },
  {
    question: 'Is there an annual discount?',
    answer: 'Yes! Annual billing saves you $90/year compared to monthly billing - that\'s like getting 4 months free.',
  },
];

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductJsonLd />
      <FAQJsonLd faqs={pricingFAQs} />
      {children}
    </>
  );
}
