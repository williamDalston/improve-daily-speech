/**
 * JSON-LD Structured Data Components for SEO
 */

const baseUrl = process.env.NEXTAUTH_URL || 'https://mindcast.app';

// Organization schema for the company
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MindCast',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'AI-powered documentary audio learning platform',
    sameAs: [
      'https://twitter.com/mindcastapp',
      // Add other social links
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@mindcast.app',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// WebApplication schema for the app
export function WebApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MindCast',
    url: baseUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    description: 'Transform any topic into captivating documentary-style audio episodes with AI.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'AI-powered documentary audio generation',
      'Personalized learning topics',
      'Text-to-speech with natural voices',
      'Interactive transcripts',
      'Learning streaks and gamification',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// SoftwareApplication schema for app stores
export function SoftwareApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MindCast',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '9.99',
      priceCurrency: 'USD',
      offerCount: '2',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Episode schema for individual episodes
interface EpisodeJsonLdProps {
  title: string;
  description: string;
  episodeId: string;
  datePublished: string;
  duration?: number; // in seconds
  transcript?: string;
}

export function EpisodeJsonLd({
  title,
  description,
  episodeId,
  datePublished,
  duration,
  transcript,
}: EpisodeJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: title,
    description: description,
    url: `${baseUrl}/e/${episodeId}`,
    datePublished: datePublished,
    ...(duration && {
      duration: `PT${Math.floor(duration / 60)}M${duration % 60}S`,
      timeRequired: `PT${Math.floor(duration / 60)}M`,
    }),
    ...(transcript && {
      transcript: {
        '@type': 'TextObject',
        text: transcript.slice(0, 5000), // Limit for SEO
      },
    }),
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'MindCast',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MindCast',
      url: baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ schema for pricing/help pages
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// BreadcrumbList for navigation
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Product schema for pricing page
export function ProductJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'MindCast Pro',
    description: 'Unlimited AI-powered documentary audio episodes with premium features',
    brand: {
      '@type': 'Brand',
      name: 'MindCast',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Monthly',
        price: '9.99',
        priceCurrency: 'USD',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Annual',
        price: '79.99',
        priceCurrency: 'USD',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/pricing`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
