/**
 * Caching is on by default wherever a Redis URL is configured, and can be
 * switched off without removing the connection details. Without `REDIS_URL`
 * the app still boots and serves every endpoint straight from Postgres.
 */
export function isCacheEnabled(): boolean {
  return (
    (process.env.CACHE_ENABLED ?? 'true').toLowerCase() === 'true' &&
    Boolean(process.env.REDIS_URL)
  );
}
