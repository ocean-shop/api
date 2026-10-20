import * as bcrypt from 'bcryptjs';
import {
  BCRYPT_SALT_ROUNDS,
  DEFAULT_REFRESH_EXPIRE_MS,
} from '../constants/auth.constants';
import { UserSession } from '../entities/user-session.entity';
import { SessionLookupOptions } from '../models/auth.models';

export async function hashRefreshToken(refreshToken: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(refreshToken, salt);
}

export function buildRefreshTokenExpiryDate(nowMs = Date.now()): Date {
  const refreshExpireMs = process.env.REFRESH_EXPIRE_TIME
    ? parseInt(process.env.REFRESH_EXPIRE_TIME, 10)
    : DEFAULT_REFRESH_EXPIRE_MS;

  return new Date(nowMs + refreshExpireMs);
}

export async function findSessionByRefreshToken(
  sessions: UserSession[],
  refreshToken: string,
  options?: SessionLookupOptions,
): Promise<UserSession | null> {
  for (const session of sessions) {
    if (options?.skipExpired && session.expiresAt < new Date()) {
      continue;
    }

    const isValid = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (isValid) {
      return session;
    }
  }

  return null;
}
