import { createHash } from 'crypto';
import { DEFAULT_REFRESH_EXPIRE_MS } from '../constants/auth.constants';
import { User } from '../entities/user.entity';
import {
  buildRefreshTokenExpiryDate,
  hashRefreshToken,
  isRefreshTokenMatch,
  toAuthUser,
} from './user-session.helpers';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

describe('user-session.helpers', () => {
  describe('hashRefreshToken', () => {
    it('should return the sha256 hex digest of the token', () => {
      expect(hashRefreshToken('token')).toBe(sha256('token'));
    });

    it('should tell apart tokens that share a long common prefix', () => {
      const prefix = 'x'.repeat(100);

      expect(hashRefreshToken(`${prefix}a`)).not.toBe(
        hashRefreshToken(`${prefix}b`),
      );
    });
  });

  describe('isRefreshTokenMatch', () => {
    it('should match a token against its own hash', () => {
      expect(isRefreshTokenMatch('token', sha256('token'))).toBe(true);
    });

    it('should reject a different token', () => {
      expect(isRefreshTokenMatch('other', sha256('token'))).toBe(false);
    });

    it('should reject a hash of another length, such as a legacy bcrypt hash', () => {
      expect(isRefreshTokenMatch('token', '$2b$10$legacy')).toBe(false);
    });
  });

  describe('buildRefreshTokenExpiryDate', () => {
    it('should add the given lifetime to now', () => {
      expect(buildRefreshTokenExpiryDate(1000, 5000)).toEqual(new Date(6000));
    });

    it('should fall back to the default lifetime', () => {
      const now = Date.now();

      expect(buildRefreshTokenExpiryDate(undefined, now)).toEqual(
        new Date(now + DEFAULT_REFRESH_EXPIRE_MS),
      );
    });
  });

  describe('toAuthUser', () => {
    it('should expose the public user fields with the role name', () => {
      const user = {
        id: 'user-id',
        email: 'a@b.c',
        mobileNumber: null,
        role: { name: 'user' },
      } as User;

      expect(toAuthUser(user)).toEqual({
        id: 'user-id',
        email: 'a@b.c',
        mobileNumber: null,
        role: 'user',
      });
    });

    it('should return a null role when the user has none', () => {
      const user = { id: 'user-id', email: null, mobileNumber: null } as User;

      expect(toAuthUser(user).role).toBeNull();
    });
  });
});
