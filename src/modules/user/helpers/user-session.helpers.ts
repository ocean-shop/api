import { createHash, timingSafeEqual } from 'crypto';
import {
  DEFAULT_REFRESH_EXPIRE_MS,
  REFRESH_TOKEN_HASH_ALGORITHM,
  REFRESH_TOKEN_HASH_ENCODING,
} from '../constants/auth.constants';
import { User } from '../entities/user.entity';
import { AuthUser } from '../models/auth.models';

/** Hashes the whole token, unlike bcrypt, which reads only its first 72 bytes. */
export function hashRefreshToken(refreshToken: string): string {
  return createHash(REFRESH_TOKEN_HASH_ALGORITHM)
    .update(refreshToken)
    .digest(REFRESH_TOKEN_HASH_ENCODING);
}

export function isRefreshTokenMatch(
  refreshToken: string,
  storedHash: string,
): boolean {
  const actual = Buffer.from(hashRefreshToken(refreshToken));
  const expected = Buffer.from(storedHash);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function buildRefreshTokenExpiryDate(
  refreshExpireMs = DEFAULT_REFRESH_EXPIRE_MS,
  nowMs = Date.now(),
): Date {
  return new Date(nowMs + refreshExpireMs);
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role?.name ?? null,
  };
}
