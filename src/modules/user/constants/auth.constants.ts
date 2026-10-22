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

/** Separate secrets, so a token of one type can never pass as the other. */
export const JWT_ACCESS_SECRET_KEY = 'JWT_ACCESS_SECRET';
export const JWT_REFRESH_SECRET_KEY = 'JWT_REFRESH_SECRET';
export const REFRESH_EXPIRE_TIME_KEY = 'REFRESH_EXPIRE_TIME';

/** The `type` claim every issued JWT carries. */
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

/**
 * Refresh tokens are long random JWTs, so a fast hash is enough; bcrypt would
 * also silently compare only their first 72 bytes.
 */
export const REFRESH_TOKEN_HASH_ALGORITHM = 'sha256';
export const REFRESH_TOKEN_HASH_ENCODING = 'hex';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const BEARER_PREFIX = 'Bearer ';

export const PRODUCTION_ENV = 'production';
export const REFRESH_TOKEN_COOKIE_SAME_SITE = 'strict';

/** Throttler that counts OTP requests per login (email / phone), not per IP. */
export const OTP_THROTTLER = 'otp';
export const OTP_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
/** One code lives 5 minutes, so a few requests per window cover resends. */
export const OTP_REQUEST_THROTTLE_LIMIT = 3;
/** Two blocked rounds of `OTP_ATTEMPTS_LIMIT` per window. */
export const OTP_VERIFY_THROTTLE_LIMIT = 10;
/** Body fields that identify who an OTP request is for, in lookup order. */
export const OTP_THROTTLE_LOGIN_FIELDS = ['login', 'email', 'phone'] as const;
