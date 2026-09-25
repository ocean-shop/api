import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  CACHE_CLIENT,
  CACHE_KEY_PREFIX,
  CACHE_SCOPE_ALL,
} from './constants/cache.constants';

export type CacheDescriptor = {
  /** Invalidation scope: a shop id, or `CACHE_SCOPE_ALL` for cross-shop data. */
  scope: string;
  /** Identifies the payload inside the scope. Must already be canonical. */
  segments: string[];
  ttlSeconds: number;
};

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Optional()
    @Inject(CACHE_CLIENT)
    private readonly client: Redis | null = null,
  ) {}

  /**
   * Returns the cached payload for `descriptor`, loading and storing it on a
   * miss. Redis is a pure accelerator: every failure degrades to `load()` so
   * the endpoint keeps answering from Postgres.
   */
  async wrap<TValue>(
    descriptor: CacheDescriptor,
    load: () => Promise<TValue>,
  ): Promise<TValue> {
    const client = this.client;

    if (!client) {
      return load();
    }

    // Reading the scope version costs a second round trip, which buys O(1)
    // invalidation: a write bumps one counter instead of scanning the keyspace.
    const key = await this.resolveKey(client, descriptor);

    if (key === null) {
      return load();
    }

    try {
      const cached = await client.get(key);

      if (cached !== null) {
        return JSON.parse(cached) as TValue;
      }
    } catch (error) {
      this.warn(`read ${key}`, error);
      return load();
    }

    const value = await load();

    if (value === undefined) {
      return value;
    }

    try {
      await client.set(key, JSON.stringify(value), 'EX', descriptor.ttlSeconds);
    } catch (error) {
      this.warn(`write ${key}`, error);
    }

    return value;
  }

  /**
   * Expires everything cached for a shop by bumping its version counter, plus
   * the cross-shop scope that shopless responses are keyed under.
   */
  async invalidate(shopId: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client
        .pipeline()
        .incr(this.versionKey(shopId))
        .incr(this.versionKey(CACHE_SCOPE_ALL))
        .exec();
    } catch (error) {
      // A missed bump only leaves clients on the previous payload until its TTL
      // runs out, so an admin write must never fail because Redis is down.
      this.warn(`invalidate ${shopId}`, error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  private async resolveKey(
    client: Redis,
    descriptor: CacheDescriptor,
  ): Promise<string | null> {
    try {
      // Missing counters read as 0 while the first INCR yields 1, so a bump
      // always moves the version even when nothing was cached before.
      const version =
        (await client.get(this.versionKey(descriptor.scope))) ?? '0';

      return [
        CACHE_KEY_PREFIX,
        descriptor.scope,
        `v${version}`,
        ...descriptor.segments,
      ].join(':');
    } catch (error) {
      this.warn(`version ${descriptor.scope}`, error);
      return null;
    }
  }

  private versionKey(scope: string): string {
    return `${CACHE_KEY_PREFIX}:${scope}:version`;
  }

  private warn(operation: string, error: unknown): void {
    this.logger.warn(
      `Cache ${operation} failed, falling back to the database: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
