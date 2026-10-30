import { ForbiddenException } from '@nestjs/common';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { JwtPayload } from '../../models/auth-request.models';
import { assertCanAccessUser } from './access.helpers';

const requesterOf = (sub: string, role: string): JwtPayload => ({
  sub,
  role,
  email: null,
  mobileNumber: null,
});

describe('assertCanAccessUser', () => {
  it('should let a client access their own data', () => {
    expect(() =>
      assertCanAccessUser('user-1', requesterOf('user-1', 'user')),
    ).not.toThrow();
  });

  it('should forbid a client from accessing another user', () => {
    expect(() =>
      assertCanAccessUser('user-1', requesterOf('user-2', 'user')),
    ).toThrow(new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED));
  });

  it('should forbid a client from accessing data without an owner', () => {
    expect(() =>
      assertCanAccessUser(null, requesterOf('user-2', 'user')),
    ).toThrow(ForbiddenException);
  });

  it.each(['admin', 'super'])('should let %s access any user', (role) => {
    expect(() =>
      assertCanAccessUser('user-1', requesterOf('admin-1', role)),
    ).not.toThrow();
  });

  it('should allow calls without a requester', () => {
    expect(() => assertCanAccessUser('user-1')).not.toThrow();
  });
});
