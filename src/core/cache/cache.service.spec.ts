import type { Redis } from 'ioredis';
import { CacheService } from './cache.service';
import { CACHE_SCOPE_ALL } from './constants/cache.constants';

describe('CacheService', () => {
  const descriptor = {
    scope: 'shop-id',
    segments: ['popular', 'shop-id'],
    ttlSeconds: 300,
  };

  let get: jest.Mock;
  let set: jest.Mock;
  let incr: jest.Mock;
  let exec: jest.Mock;
  let client: Redis;

  beforeEach(() => {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue('OK');
    incr = jest.fn();
    exec = jest.fn().mockResolvedValue([]);
    incr.mockImplementation(() => ({ incr, exec }));

    client = {
      get,
      set,
      pipeline: jest.fn(() => ({ incr, exec })),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    } as unknown as Redis;
  });

  it('should load without caching when no client is configured', async () => {
    const service = new CacheService();
    const load = jest.fn().mockResolvedValue(['value']);

    await expect(service.wrap(descriptor, load)).resolves.toEqual(['value']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should store a loaded value under a versioned key with a ttl', async () => {
    const service = new CacheService(client);
    const load = jest.fn().mockResolvedValue([{ id: '1' }]);

    const result = await service.wrap(descriptor, load);

    expect(result).toEqual([{ id: '1' }]);
    expect(get).toHaveBeenCalledWith('cache:shop-id:version');
    expect(set).toHaveBeenCalledWith(
      'cache:shop-id:v0:popular:shop-id',
      JSON.stringify([{ id: '1' }]),
      'EX',
      300,
    );
  });

  it('should return the cached payload without loading', async () => {
    const service = new CacheService(client);
    get.mockResolvedValueOnce('7').mockResolvedValueOnce('[{"id":"1"}]');
    const load = jest.fn();

    const result = await service.wrap(descriptor, load);

    expect(result).toEqual([{ id: '1' }]);
    expect(load).not.toHaveBeenCalled();
    expect(get).toHaveBeenLastCalledWith('cache:shop-id:v7:popular:shop-id');
  });

  it('should key a scope separately once its version was bumped', async () => {
    const service = new CacheService(client);
    await service.wrap(descriptor, jest.fn().mockResolvedValue([]));
    const beforeBump = set.mock.calls[0][0] as string;

    // Only the version lookup moves; the payload is still a miss.
    get.mockResolvedValueOnce('1');
    await service.wrap(descriptor, jest.fn().mockResolvedValue([]));
    const afterBump = set.mock.calls[1][0] as string;

    expect(beforeBump).not.toEqual(afterBump);
  });

  it('should fall back to the database when reading fails', async () => {
    const service = new CacheService(client);
    get
      .mockResolvedValueOnce('0')
      .mockRejectedValueOnce(new Error('ECONNRESET'));
    const load = jest.fn().mockResolvedValue(['value']);

    await expect(service.wrap(descriptor, load)).resolves.toEqual(['value']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should fall back to the database when the version lookup fails', async () => {
    const service = new CacheService(client);
    get.mockRejectedValue(new Error('ECONNRESET'));
    const load = jest.fn().mockResolvedValue(['value']);

    await expect(service.wrap(descriptor, load)).resolves.toEqual(['value']);
    expect(set).not.toHaveBeenCalled();
  });

  it('should still answer when writing fails', async () => {
    const service = new CacheService(client);
    set.mockRejectedValue(new Error('OOM'));

    await expect(
      service.wrap(descriptor, jest.fn().mockResolvedValue(['value'])),
    ).resolves.toEqual(['value']);
  });

  it('should not cache a rejected load', async () => {
    const service = new CacheService(client);

    await expect(
      service.wrap(descriptor, () => Promise.reject(new Error('not found'))),
    ).rejects.toThrow('not found');
    expect(set).not.toHaveBeenCalled();
  });

  it('should bump the shop and cross-shop versions on invalidation', async () => {
    const service = new CacheService(client);

    await service.invalidate('shop-id');

    expect(incr).toHaveBeenCalledWith('cache:shop-id:version');
    expect(incr).toHaveBeenCalledWith(`cache:${CACHE_SCOPE_ALL}:version`);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('should swallow invalidation failures so admin writes still succeed', async () => {
    const service = new CacheService(client);
    exec.mockRejectedValue(new Error('ECONNRESET'));

    await expect(service.invalidate('shop-id')).resolves.toBeUndefined();
  });

  it('should close the connection on shutdown', async () => {
    const service = new CacheService(client);

    await service.onModuleDestroy();

    expect(client.quit).toHaveBeenCalledTimes(1);
  });
});
