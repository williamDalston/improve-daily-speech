/**
 * Environment variable validation
 * Validates required env vars at startup to fail fast
 */

interface EnvConfig {
  name: string;
  required: boolean;
  validation?: (value: string) => boolean;
  hint?: string;
}

const envConfigs: EnvConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    validation: (v) => v.startsWith('postgres'),
    hint: 'Should be a PostgreSQL connection string',
  },

  // Auth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    validation: (v) => v.length >= 32,
    hint: 'Should be at least 32 characters. Generate with: openssl rand -base64 32',
  },
  {
    name: 'NEXTAUTH_URL',
    required: process.env.NODE_ENV === 'production',
    validation: (v) => v.startsWith('https://') || v.startsWith('http://localhost'),
    hint: 'Should be the full URL of your app (e.g., https://mindcast.app)',
  },

  // OAuth (at least one provider required for login)
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    hint: 'Required for Google OAuth login',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    hint: 'Required for Google OAuth login',
  },

  // AI APIs (at least one required for content generation)
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    validation: (v) => v.startsWith('sk-ant-'),
    hint: 'Anthropic API key for Claude',
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    validation: (v) => v.startsWith('sk-'),
    hint: 'OpenAI API key for TTS',
  },

  // Stripe (required for payments)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    validation: (v) => v.startsWith('sk_'),
    hint: 'Stripe secret key (starts with sk_test_ or sk_live_)',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    validation: (v) => v.startsWith('whsec_'),
    hint: 'Stripe webhook signing secret',
  },

  // Redis (Upstash - recommended for production rate limiting)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    validation: (v) => v.startsWith('https://'),
    hint: 'Upstash Redis REST URL for production rate limiting',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    hint: 'Upstash Redis REST token for production rate limiting',
  },
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const config of envConfigs) {
    const value = process.env[config.name];

    if (!value) {
      if (config.required) {
        errors.push(`Missing required env var: ${config.name}${config.hint ? ` (${config.hint})` : ''}`);
      }
      continue;
    }

    if (config.validation && !config.validation(value)) {
      if (config.required) {
        errors.push(`Invalid ${config.name}: ${config.hint || 'validation failed'}`);
      } else {
        warnings.push(`Warning: ${config.name} may be misconfigured: ${config.hint || 'validation failed'}`);
      }
    }
  }

  // Check for at least one AI provider
  const hasAiProvider =
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!hasAiProvider) {
    warnings.push('No AI provider configured. Content generation will not work.');
  }

  // Check for at least one auth provider
  const hasAuthProvider =
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (!hasAuthProvider) {
    warnings.push('No OAuth provider configured. Social login will not work.');
  }

  // Check for Redis (recommended for production rate limiting)
  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!hasRedis && process.env.NODE_ENV === 'production') {
    warnings.push('No Redis configured. Rate limiting will use in-memory storage (resets on restart).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Run validation and log results (call this in instrumentation.ts or server startup)
export function validateEnvAndLog(): void {
  const result = validateEnv();

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    result.warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  if (!result.isValid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach((e) => console.error(`   - ${e}`));

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Check logs for details.');
    } else {
      console.error('\n   Fix these issues before deploying to production.\n');
    }
  } else if (result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}
