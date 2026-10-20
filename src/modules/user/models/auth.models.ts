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

export type AuthResponse = AuthTokens & {
  user: AuthUser;
};

/** A login split into whichever identity it turned out to be. */
export type LoginIdentity = {
  email?: string;
  phone?: string;
};

export type SessionLookupOptions = {
  skipExpired?: boolean;
};

export type RefreshTokenPayload = {
  sub: string;
};
