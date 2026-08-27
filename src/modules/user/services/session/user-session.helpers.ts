import * as bcrypt from 'bcryptjs';
import { UserSession } from '../../entities/user-session.entity';

const DEFAULT_REFRESH_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashRefreshToken(refreshToken: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
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
  options?: { skipExpired?: boolean },
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
