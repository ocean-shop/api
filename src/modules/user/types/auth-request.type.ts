import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string | null;
  role?: string | null;
  mobileNumber: string | null;
}

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};
