import { TOKEN_TYPES } from '../constants/auth.constants';

export type OtpCode = {
  code: string;
  codeHash: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
  mobileNumber: string | null;
  role: string | null;
};

/** What the API returns: the refresh token travels only in its httpOnly cookie. */
export type AuthResponse = Pick<AuthTokens, 'accessToken'> & {
  user: AuthUser;
};

/** A freshly issued session, before the controller moves the refresh token into a cookie. */
export type AuthSession = AuthTokens & {
  user: AuthUser;
};

/** A login split into whichever identity it turned out to be. */
export type LoginIdentity = {
  email?: string;
  phone?: string;
};

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

export type RefreshTokenPayload = {
  sub: string;
  /** Id of the `user_sessions` row this token belongs to. */
  sid: string;
  type: TokenType;
};

export type RefreshTokenVerifyOptions = {
  ignoreExpiration?: boolean;
};

export type SessionClient = {
  userAgent?: string;
  ipAddress?: string;
};

export type SessionRotation = {
  sessionId: string;
  currentHash: string;
  nextHash: string;
  expiresAt: Date;
} & SessionClient;
