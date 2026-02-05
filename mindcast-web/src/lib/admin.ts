export function isAdminEmail(email?: string | null): boolean {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return false;

  const env = process.env.ADMIN_EMAILS;
  if (!env) {
    return process.env.NODE_ENV !== 'production';
  }

  const allowlist = env
    .split(',')
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);

  return allowlist.includes(normalized);
}
