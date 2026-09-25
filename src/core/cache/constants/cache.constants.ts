export const CACHE_CLIENT = 'CACHE_CLIENT';

/** Namespaces every key so the cache can share a Redis instance with BullMQ. */
export const CACHE_KEY_PREFIX = 'cache';

/**
 * Invalidation scope for payloads that are not tied to a single shop. Bumped
 * alongside the shop scope on every write, so cross-shop responses expire too.
 */
export const CACHE_SCOPE_ALL = 'all';
