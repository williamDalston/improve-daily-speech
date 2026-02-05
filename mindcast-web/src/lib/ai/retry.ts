export function getErrorStatus(error: unknown): number | null {
  const anyError = error as { status?: number; response?: { status?: number } };
  return anyError?.status ?? anyError?.response?.status ?? null;
}

export function isRetryableStatus(status: number | null): boolean {
  if (!status) return true;
  return status === 408 || status === 429 || status >= 500;
}

export function isRetryableError(error: unknown): boolean {
  return isRetryableStatus(getErrorStatus(error));
}
