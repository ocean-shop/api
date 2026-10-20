/** Wrong codes allowed before the OTP is blocked. */
export const OTP_ATTEMPTS_LIMIT = 5;
export const OTP_BLOCK_WINDOW_MS = 5 * 60 * 1000;

/** OTP codes are four digits: the lowest code and how many codes there are. */
export const OTP_CODE_MIN = 1000;
export const OTP_CODE_RANGE = 9000;
export const OTP_CODE_LENGTH = 4;

export const BCRYPT_SALT_ROUNDS = 10;

export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
export const DEFAULT_REFRESH_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const BEARER_PREFIX = 'Bearer ';

export const PRODUCTION_ENV = 'production';
export const REFRESH_TOKEN_COOKIE_SAME_SITE = 'strict';
