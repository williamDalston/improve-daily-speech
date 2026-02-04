import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | MindCast',
  description: 'Privacy Policy for MindCast - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="prose prose-gray mx-auto max-w-3xl dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-text-muted">Last updated: February 2026</p>

      <h2>1. Introduction</h2>
      <p>
        MindCast ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our AI-powered audio learning platform.
      </p>

      <h2>2. Information We Collect</h2>

      <h3>2.1 Account Information</h3>
      <p>When you sign in with Google, we collect:</p>
      <ul>
        <li>Name and email address</li>
        <li>Profile picture (optional)</li>
        <li>Google account ID (for authentication)</li>
      </ul>

      <h3>2.2 Usage Data</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>Topics you request for episode generation</li>
        <li>Episodes created and listening history</li>
        <li>Preferences (style, interests, learning mode)</li>
        <li>Interaction data (quiz responses, reflections, bookmarks)</li>
        <li>Device and browser information</li>
        <li>IP address (for security and rate limiting)</li>
      </ul>

      <h3>2.3 Payment Information</h3>
      <p>
        Payment processing is handled by Stripe. We do not store your full credit card details. We receive:
      </p>
      <ul>
        <li>Stripe customer ID</li>
        <li>Subscription status</li>
        <li>Last 4 digits of payment method (for display purposes)</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and improve the Service</li>
        <li>Generate personalized audio content</li>
        <li>Process payments and manage subscriptions</li>
        <li>Send important service updates</li>
        <li>Provide customer support</li>
        <li>Analyze usage patterns to improve features</li>
        <li>Prevent fraud and enforce our terms</li>
      </ul>

      <h2>4. AI Processing</h2>
      <p>
        To generate audio episodes, we send your topic requests to AI providers (Anthropic, OpenAI, Google). These providers process your requests according to their own privacy policies. We do not share your personal account information with these providers.
      </p>

      <h2>5. Data Sharing</h2>
      <p>We share your data only with:</p>
      <ul>
        <li>
          <strong>Service Providers:</strong> Companies that help us operate the Service (hosting, payments, analytics)
        </li>
        <li>
          <strong>AI Providers:</strong> For content generation (topic content only, not account data)
        </li>
        <li>
          <strong>Legal Requirements:</strong> When required by law or to protect our rights
        </li>
      </ul>
      <p>We do not sell your personal data to third parties.</p>

      <h2>6. Data Retention</h2>
      <p>We retain your data for as long as your account is active. You may:</p>
      <ul>
        <li>Delete individual episodes at any time</li>
        <li>Request full account deletion via settings or by contacting us</li>
      </ul>
      <p>
        After account deletion, we may retain anonymized analytics data and may be required to retain certain data for legal or business purposes.
      </p>

      <h2>7. Data Security</h2>
      <p>We implement appropriate security measures including:</p>
      <ul>
        <li>Encryption in transit (HTTPS)</li>
        <li>Secure authentication via OAuth</li>
        <li>Database encryption</li>
        <li>Regular security reviews</li>
        <li>Access controls for employees</li>
      </ul>
      <p>
        No system is 100% secure. If you discover a security vulnerability, please report it to{' '}
        <a href="mailto:security@mindcast.app" className="text-brand hover:underline">
          security@mindcast.app
        </a>
        .
      </p>

      <h2>8. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Delete your data</li>
        <li>Export your data</li>
        <li>Opt out of certain processing</li>
        <li>Withdraw consent</li>
      </ul>
      <p>
        To exercise these rights, contact us at{' '}
        <a href="mailto:privacy@mindcast.app" className="text-brand hover:underline">
          privacy@mindcast.app
        </a>
        .
      </p>

      <h2>9. Cookies</h2>
      <p>We use cookies for:</p>
      <ul>
        <li>
          <strong>Essential:</strong> Authentication and security (required)
        </li>
        <li>
          <strong>Analytics:</strong> Understanding usage patterns (optional)
        </li>
      </ul>
      <p>You can manage cookie preferences in your browser settings.</p>

      <h2>10. Children's Privacy</h2>
      <p>
        MindCast is not intended for users under 13 years of age. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us.
      </p>

      <h2>11. International Transfers</h2>
      <p>
        Your data may be processed in the United States or other countries where our service providers operate. We ensure appropriate safeguards are in place for international transfers.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this policy periodically. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.
      </p>

      <h2>13. Contact Us</h2>
      <p>For privacy-related questions or concerns:</p>
      <p>
        Email:{' '}
        <a href="mailto:privacy@mindcast.app" className="text-brand hover:underline">
          privacy@mindcast.app
        </a>
      </p>
    </div>
  );
}
