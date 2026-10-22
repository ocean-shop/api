import type { CookieOptions, Response } from 'express';
import {
  DEFAULT_REFRESH_EXPIRE_MS,
  PRODUCTION_ENV,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_SAME_SITE,
} from '../constants/auth.constants';
import { AuthResponse, AuthSession } from '../models/auth.models';

/** Options shared by setting and clearing the cookie, so the browser matches them. */
export function buildRefreshTokenClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === PRODUCTION_ENV,
    sameSite: REFRESH_TOKEN_COOKIE_SAME_SITE,
  };
}

export function buildRefreshTokenCookieOptions(): CookieOptions {
  return {
    ...buildRefreshTokenClearCookieOptions(),
    maxAge: process.env.REFRESH_EXPIRE_TIME
      ? parseInt(process.env.REFRESH_EXPIRE_TIME, 10)
      : DEFAULT_REFRESH_EXPIRE_MS,
  };
}

/**
 * Moves the refresh token into its httpOnly cookie and returns the rest, so
 * the token never appears in a response body that page scripts can read.
 */
export function sendAuthSession(
  response: Response,
  session: AuthSession,
): AuthResponse {
  const { refreshToken, ...authResponse } = session;

  response.cookie(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    buildRefreshTokenCookieOptions(),
  );

  return authResponse;
}
