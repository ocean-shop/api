import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { AuthenticatedRequest } from '../../models/auth-request.models';
import { UserRepository } from '../../repositories/user/user.repository';
import { JwtAuthGuard } from './jwt-auth.guard';

const contextFor = (request: Partial<AuthenticatedRequest>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const bearer = (token: string): Partial<AuthenticatedRequest> => ({
  headers: { authorization: `Bearer ${token}` },
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let userRepository: { findAuthState: jest.Mock };

  const invalidToken = new UnauthorizedException(
    AUTH_MESSAGES.ACCESS_TOKEN_INVALID,
  );

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    userRepository = {
      findAuthState: jest
        .fn()
        .mockResolvedValue({ isActive: true, role: 'admin' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: UserRepository, useValue: userRepository },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should attach the verified payload to the request', async () => {
    const payload = { sub: 'user-1', role: 'admin', type: 'access' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const request = bearer('token-123');

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-123');
    expect(userRepository.findAuthState).toHaveBeenCalledWith('user-1');
    expect(request.user).toEqual(payload);
  });

  it('should use the current role instead of the one in the token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      role: 'super',
      type: 'access',
    });
    userRepository.findAuthState.mockResolvedValue({
      isActive: true,
      role: 'admin',
    });
    const request = bearer('token-123');

    await guard.canActivate(contextFor(request));

    expect(request.user?.role).toBe('admin');
  });

  it.each([
    ['no authorization header', {}],
    ['a non-bearer header', { authorization: 'Basic abc' }],
  ])('should reject a request with %s', async (_label, headers) => {
    await expect(guard.canActivate(contextFor({ headers }))).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_REQUIRED),
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should reject an invalid or expired token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      guard.canActivate(contextFor(bearer('stale'))),
    ).rejects.toThrow(invalidToken);
  });

  it.each([
    ['a refresh token', { sub: 'user-1', sid: 's', type: 'refresh' }],
    ['a token without a type', { sub: 'user-1', role: 'admin' }],
  ])('should reject %s', async (_label, payload) => {
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(
      guard.canActivate(contextFor(bearer('token'))),
    ).rejects.toThrow(invalidToken);
    expect(userRepository.findAuthState).not.toHaveBeenCalled();
  });

  it.each([
    ['blocked', { isActive: false, role: 'admin' }],
    ['deleted', null],
  ])('should reject a user who was %s after login', async (_label, state) => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', type: 'access' });
    userRepository.findAuthState.mockResolvedValue(state);
    const request = bearer('token');

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      invalidToken,
    );
    expect(request.user).toBeUndefined();
  });
});
