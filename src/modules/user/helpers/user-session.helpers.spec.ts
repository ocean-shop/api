import * as bcrypt from 'bcryptjs';
import {
  BCRYPT_SALT_ROUNDS,
  DEFAULT_REFRESH_EXPIRE_MS,
} from '../constants/auth.constants';
import { UserSession } from '../entities/user-session.entity';
import {
  buildRefreshTokenExpiryDate,
  findSessionByRefreshToken,
  hashRefreshToken,
} from './user-session.helpers';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

const sessionOf = (id: string, expiresAt: Date): UserSession =>
  ({ id, refreshTokenHash: `hash-${id}`, expiresAt }) as UserSession;

describe('user-session.helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  describe('hashRefreshToken', () => {
    it('should hash the token with a fresh salt', async () => {
      jest.mocked(bcrypt.genSalt).mockResolvedValue('salt' as never);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

      await expect(hashRefreshToken('token')).resolves.toBe('hashed');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(BCRYPT_SALT_ROUNDS);
      expect(bcrypt.hash).toHaveBeenCalledWith('token', 'salt');
    });
  });

  describe('buildRefreshTokenExpiryDate', () => {
    it('should use the configured lifetime', () => {
      process.env.REFRESH_EXPIRE_TIME = '1000';

      expect(buildRefreshTokenExpiryDate(5000)).toEqual(new Date(6000));
    });

    it('should fall back to the default lifetime', () => {
      delete process.env.REFRESH_EXPIRE_TIME;

      expect(buildRefreshTokenExpiryDate(0)).toEqual(
        new Date(DEFAULT_REFRESH_EXPIRE_MS),
      );
    });
  });

  describe('findSessionByRefreshToken', () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);

    it('should return the session whose hash matches the token', async () => {
      const sessions = [sessionOf('a', future), sessionOf('b', future)];
      jest
        .mocked(bcrypt.compare)
        .mockResolvedValueOnce(false as never)
        .mockResolvedValueOnce(true as never);

      await expect(findSessionByRefreshToken(sessions, 'token')).resolves.toBe(
        sessions[1],
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('token', 'hash-b');
    });

    it('should return null when no session matches', async () => {
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        findSessionByRefreshToken([sessionOf('a', future)], 'token'),
      ).resolves.toBeNull();
    });

    it('should skip expired sessions when asked to', async () => {
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      const sessions = [sessionOf('expired', past), sessionOf('live', future)];

      await expect(
        findSessionByRefreshToken(sessions, 'token', { skipExpired: true }),
      ).resolves.toBe(sessions[1]);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should match expired sessions by default', async () => {
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      const sessions = [sessionOf('expired', past)];

      await expect(findSessionByRefreshToken(sessions, 'token')).resolves.toBe(
        sessions[0],
      );
    });
  });
});
