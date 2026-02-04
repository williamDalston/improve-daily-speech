/**
 * Next.js Instrumentation
 * Runs once when the server starts
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvAndLog } = await import('@/lib/env-validation');
    validateEnvAndLog();
  }
}
