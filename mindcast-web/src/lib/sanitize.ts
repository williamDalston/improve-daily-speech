/**
 * Input Sanitization Utilities
 *
 * Protects against XSS, injection attacks, and malformed input.
 */

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input for safe storage and display
 * Removes potentially dangerous content while preserving readability
 */
export function sanitizeInput(input: string, options: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowBasicPunctuation?: boolean;
} = {}): string {
  const {
    maxLength = 10000,
    allowNewlines = true,
    allowBasicPunctuation = true,
  } = options;

  let sanitized = input;

  // Trim whitespace
  sanitized = sanitized.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines/tabs if allowed)
  if (allowNewlines) {
    // Keep \n, \r, \t but remove other control chars
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    // Remove all control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ' ');
  }

  // Strip HTML tags
  sanitized = stripHtml(sanitized);

  // Remove script-like patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize topic input specifically
 * Topics are short and should be simple text
 */
export function sanitizeTopic(topic: string): string {
  return sanitizeInput(topic, {
    maxLength: 500,
    allowNewlines: false,
  });
}

/**
 * Sanitize personal context / longer text
 */
export function sanitizeContext(context: string): string {
  return sanitizeInput(context, {
    maxLength: 2000,
    allowNewlines: true,
  });
}

/**
 * Sanitize question input for Ask feature
 */
export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, {
    maxLength: 1000,
    allowNewlines: false,
  });
}

/**
 * Sanitize playlist/episode names
 */
export function sanitizeName(name: string): string {
  return sanitizeInput(name, {
    maxLength: 200,
    allowNewlines: false,
  });
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Max length check
  if (sanitized.length > 254) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(
  arr: unknown,
  itemSanitizer: (s: string) => string = sanitizeInput
): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter((item): item is string => typeof item === 'string')
    .map(itemSanitizer)
    .filter((item) => item.length > 0);
}

/**
 * Validate that input is a valid ID (cuid format)
 */
export function isValidId(id: string): boolean {
  // CUID format: starts with 'c', followed by alphanumeric
  return /^c[a-z0-9]{20,30}$/i.test(id);
}

/**
 * Sanitize ID - returns null if invalid
 */
export function sanitizeId(id: string): string | null {
  const trimmed = id.trim();
  return isValidId(trimmed) ? trimmed : null;
}

/**
 * Check for common SQL injection patterns
 * This is a secondary defense - primary defense is using Prisma's parameterized queries
 */
export function hasSqlInjectionPattern(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /('|")\s*(OR|AND)\s*('|"|\d)/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
    /--\s*$/,
    /\/\*.*\*\//,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Content moderation - check for obviously inappropriate content
 * This is a basic filter - production should use AI moderation
 */
export function hasInappropriateContent(input: string): boolean {
  const lowerInput = input.toLowerCase();

  // Very basic blocklist - in production, use AI content moderation
  const blockedPatterns = [
    // Illegal content requests
    /how to (make|build|create) (a )?(bomb|explosive|weapon)/i,
    /child (porn|abuse)/i,
    // Obvious spam/scam patterns
    /(buy|sell) (drugs|weapons)/i,
  ];

  return blockedPatterns.some((pattern) => pattern.test(lowerInput));
}
