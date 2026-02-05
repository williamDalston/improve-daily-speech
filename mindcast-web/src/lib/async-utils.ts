export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  shouldRetry?: (error: unknown) => boolean;
  label?: string;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string = 'operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 250,
    maxDelayMs = 2000,
    jitter = 0.2,
    shouldRetry = () => true,
    label = 'operation',
  }: RetryOptions = {}
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetry(error)) {
        break;
      }

      const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitterAmount = exponential * jitter * (Math.random() * 2 - 1);
      const delay = Math.max(0, exponential + jitterAmount);

      console.warn(`${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }

    attempt += 1;
  }

  throw lastError ?? new Error(`${label} failed after ${retries + 1} attempts`);
}
