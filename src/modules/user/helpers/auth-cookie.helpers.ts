import type { CookieOptions } from 'express';
import {
  PRODUCTION_ENV,
  REFRESH_TOKEN_COOKIE_SAME_SITE,
} from '../constants/auth.constants';

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
    maxAge: parseInt(process.env.REFRESH_EXPIRE_TIME ?? '0', 10),
  };
}
