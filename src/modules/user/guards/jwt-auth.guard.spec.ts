import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_MESSAGES } from '../constants/auth-messages.constants';
import { AuthenticatedRequest } from '../models/auth-request.models';
import { JwtAuthGuard } from './jwt-auth.guard';

const contextFor = (request: Partial<AuthenticatedRequest>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard, { provide: JwtService, useValue: jwtService }],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should attach the verified payload to the request', async () => {
    const payload = { sub: 'user-1', role: 'admin' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer token-123' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-123');
    expect(request.user).toBe(payload);
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
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer stale' } }),
      ),
    ).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGES.ACCESS_TOKEN_INVALID),
    );
  });
});
