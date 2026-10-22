import { Request } from 'express';
import { TokenType } from './auth.models';

export type JwtPayload = {
  sub: string;
  email: string | null;
  role?: string | null;
  mobileNumber: string | null;
  type?: TokenType;
};

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

/** The parts of a user the access guard re-checks on every request. */
export type UserAuthState = {
  isActive: boolean;
  role: string | null;
};
