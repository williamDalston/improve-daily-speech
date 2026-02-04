/**
 * Email Service
 *
 * Centralized email sending using Resend (or other providers).
 * Configure RESEND_API_KEY in environment variables.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'MindCast <noreply@mindcast.app>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Email send failed:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// Email Templates
// ============================================

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #1f2937;
`;

const buttonStyles = `
  display: inline-block;
  background-color: #4338ca;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
`;

/**
 * Welcome email for new users
 */
export function getWelcomeEmail(name: string): { subject: string; html: string; text: string } {
  const subject = 'Welcome to MindCast!';

  const html = `
    <div style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4338ca; margin-bottom: 24px;">Welcome to MindCast!</h1>

      <p>Hi ${name},</p>

      <p>Thanks for joining MindCast! You're about to transform how you learn.</p>

      <p>With MindCast, you can turn any topic into a documentary-style audio episode. Here's what you can do:</p>

      <ul>
        <li><strong>Create episodes</strong> on any topic you're curious about</li>
        <li><strong>Listen anywhere</strong> - during commutes, workouts, or relaxation</li>
        <li><strong>Deepen your learning</strong> with quizzes, reflections, and Q&A</li>
        <li><strong>Track your progress</strong> with streaks and XP</li>
      </ul>

      <p style="margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/create" style="${buttonStyles}">
          Create Your First Episode
        </a>
      </p>

      <p>Have questions? Just reply to this email - we're here to help!</p>

      <p>Happy learning,<br>The MindCast Team</p>
    </div>
  `;

  const text = `
Welcome to MindCast!

Hi ${name},

Thanks for joining MindCast! You're about to transform how you learn.

With MindCast, you can turn any topic into a documentary-style audio episode.

Create your first episode: ${process.env.NEXTAUTH_URL}/create

Happy learning,
The MindCast Team
  `.trim();

  return { subject, html, text };
}

/**
 * Episode ready notification
 */
export function getEpisodeReadyEmail(
  name: string,
  episodeTitle: string,
  episodeId: string
): { subject: string; html: string; text: string } {
  const subject = `Your episode "${episodeTitle}" is ready!`;
  const episodeUrl = `${process.env.NEXTAUTH_URL}/episode/${episodeId}`;

  const html = `
    <div style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4338ca; margin-bottom: 24px;">Your Episode is Ready!</h1>

      <p>Hi ${name},</p>

      <p>Great news! Your episode "<strong>${episodeTitle}</strong>" has been generated and is ready to listen.</p>

      <p style="margin: 32px 0;">
        <a href="${episodeUrl}" style="${buttonStyles}">
          Listen Now
        </a>
      </p>

      <p>After listening, don't forget to:</p>
      <ul>
        <li>Test your knowledge with the quiz</li>
        <li>Reflect on what you learned</li>
        <li>Ask follow-up questions</li>
      </ul>

      <p>Happy learning,<br>The MindCast Team</p>
    </div>
  `;

  const text = `
Your Episode is Ready!

Hi ${name},

Great news! Your episode "${episodeTitle}" has been generated and is ready to listen.

Listen now: ${episodeUrl}

Happy learning,
The MindCast Team
  `.trim();

  return { subject, html, text };
}

/**
 * Subscription confirmation
 */
export function getSubscriptionEmail(
  name: string,
  plan: 'monthly' | 'annual'
): { subject: string; html: string; text: string } {
  const subject = 'Welcome to MindCast Pro!';
  const planName = plan === 'monthly' ? 'Monthly' : 'Annual';

  const html = `
    <div style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4338ca; margin-bottom: 24px;">Welcome to MindCast Pro!</h1>

      <p>Hi ${name},</p>

      <p>Thank you for upgrading to MindCast Pro (${planName})! You now have access to:</p>

      <ul>
        <li><strong>Unlimited episodes</strong> - Create as many as you want</li>
        <li><strong>Full AI pipeline</strong> - Enhanced research and narration</li>
        <li><strong>All learning tools</strong> - Quiz, journal, reflections, and more</li>
        <li><strong>RSS feed</strong> - Listen in your favorite podcast app</li>
        <li><strong>Priority support</strong> - We're here to help</li>
      </ul>

      <p style="margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/create" style="${buttonStyles}">
          Start Creating
        </a>
      </p>

      <p>Questions? Reply to this email anytime.</p>

      <p>Happy learning,<br>The MindCast Team</p>
    </div>
  `;

  const text = `
Welcome to MindCast Pro!

Hi ${name},

Thank you for upgrading to MindCast Pro (${planName})!

You now have access to unlimited episodes, full AI pipeline, all learning tools, RSS feed, and priority support.

Start creating: ${process.env.NEXTAUTH_URL}/create

Happy learning,
The MindCast Team
  `.trim();

  return { subject, html, text };
}

/**
 * Daily streak reminder (optional - for re-engagement)
 */
export function getStreakReminderEmail(
  name: string,
  currentStreak: number
): { subject: string; html: string; text: string } {
  const subject = `Don't lose your ${currentStreak}-day streak!`;

  const html = `
    <div style="${baseStyles} max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4338ca; margin-bottom: 24px;">Your Streak is at Risk!</h1>

      <p>Hi ${name},</p>

      <p>You're on a <strong>${currentStreak}-day learning streak</strong>! Don't let it slip away.</p>

      <p>Take a few minutes today to create or listen to an episode and keep your momentum going.</p>

      <p style="margin: 32px 0;">
        <a href="${process.env.NEXTAUTH_URL}/library" style="${buttonStyles}">
          Keep Your Streak
        </a>
      </p>

      <p style="font-size: 12px; color: #6b7280;">
        Don't want streak reminders? <a href="${process.env.NEXTAUTH_URL}/settings">Update your preferences</a>
      </p>

      <p>Happy learning,<br>The MindCast Team</p>
    </div>
  `;

  const text = `
Your Streak is at Risk!

Hi ${name},

You're on a ${currentStreak}-day learning streak! Don't let it slip away.

Keep your streak: ${process.env.NEXTAUTH_URL}/library

Happy learning,
The MindCast Team
  `.trim();

  return { subject, html, text };
}
