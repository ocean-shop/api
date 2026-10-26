import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../user-session/user-session.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { hashRefreshToken } from '../../helpers/user-session.helpers';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let userRepository: any;
  let userSessionRepository: any;
  let authService: any;
  let userSessionService: any;

  const session = {
    id: 'session-id',
    userId: 'uuid',
    refreshTokenHash: hashRefreshToken('current-token'),
  };
  const user = { id: 'uuid', isActive: true, role: { name: 'user' } };
  const rotated = {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
    user: { id: 'uuid', email: null, mobileNumber: null, role: 'user' },
  };
  const invalid = new UnauthorizedException(
    AUTH_MESSAGES.REFRESH_TOKEN_INVALID,
  );
  const CLIENT = ['user'];
  const ADMIN = ['admin', 'super'];

  beforeEach(async () => {
    userRepository = { findById: jest.fn().mockResolvedValue(user) };
    userSessionRepository = {
      findActiveById: jest.fn().mockResolvedValue(session),
    };
    authService = {
      verifyRefreshToken: jest
        .fn()
        .mockReturnValue({ sub: 'uuid', sid: 'session-id', type: 'refresh' }),
    };
    userSessionService = {
      rotateSession: jest.fn().mockResolvedValue(rotated),
      revokeSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: UserRepository, useValue: userRepository },
        { provide: UserSessionRepository, useValue: userSessionRepository },
        { provide: AuthService, useValue: authService },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  it('should require a refresh token', async () => {
    await expect(service.refreshToken('', CLIENT)).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED),
    );
  });

  it('should rotate the session the token belongs to', async () => {
    const result = await service.refreshToken(
      'current-token',
      CLIENT,
      'agent',
      'ip',
    );

    expect(authService.verifyRefreshToken).toHaveBeenCalledWith(
      'current-token',
    );
    expect(userSessionRepository.findActiveById).toHaveBeenCalledWith(
      'session-id',
      'uuid',
    );
    expect(userSessionService.rotateSession).toHaveBeenCalledWith(
      session,
      user,
      { userAgent: 'agent', ipAddress: 'ip' },
    );
    expect(result).toBe(rotated);
  });

  it('should propagate an invalid or wrongly typed token', async () => {
    authService.verifyRefreshToken.mockImplementation(() => {
      throw invalid;
    });

    await expect(service.refreshToken('access-token', CLIENT)).rejects.toThrow(
      invalid,
    );
    expect(userSessionRepository.findActiveById).not.toHaveBeenCalled();
  });

  it('should reject when the session is revoked, expired or unknown', async () => {
    userSessionRepository.findActiveById.mockResolvedValue(null);

    await expect(service.refreshToken('current-token', CLIENT)).rejects.toThrow(
      invalid,
    );
    expect(userSessionService.rotateSession).not.toHaveBeenCalled();
  });

  it('should reject a token that was already rotated out', async () => {
    await expect(
      service.refreshToken('previous-token', CLIENT),
    ).rejects.toThrow(invalid);
    expect(userSessionService.rotateSession).not.toHaveBeenCalled();
  });

  it('should revoke the session and refuse a blocked user', async () => {
    userRepository.findById.mockResolvedValue({ ...user, isActive: false });

    await expect(service.refreshToken('current-token', CLIENT)).rejects.toThrow(
      invalid,
    );
    expect(userSessionService.revokeSession).toHaveBeenCalledWith(
      'session-id',
      'uuid',
    );
    expect(userSessionService.rotateSession).not.toHaveBeenCalled();
  });

  it('should revoke the session of a deleted user', async () => {
    userRepository.findById.mockRejectedValue(new NotFoundException());

    await expect(service.refreshToken('current-token', CLIENT)).rejects.toThrow(
      invalid,
    );
    expect(userSessionService.revokeSession).toHaveBeenCalledWith(
      'session-id',
      'uuid',
    );
  });

  it('should refuse a client session in the admin panel without revoking it', async () => {
    await expect(service.refreshToken('current-token', ADMIN)).rejects.toThrow(
      invalid,
    );
    expect(userSessionService.revokeSession).not.toHaveBeenCalled();
    expect(userSessionService.rotateSession).not.toHaveBeenCalled();
  });

  it('should refuse an admin session in the shop', async () => {
    userRepository.findById.mockResolvedValue({
      ...user,
      role: { name: 'admin' },
    });

    await expect(service.refreshToken('current-token', CLIENT)).rejects.toThrow(
      invalid,
    );
    expect(userSessionService.rotateSession).not.toHaveBeenCalled();
  });

  it('should refuse a user without a role', async () => {
    userRepository.findById.mockResolvedValue({ ...user, role: null });

    await expect(service.refreshToken('current-token', CLIENT)).rejects.toThrow(
      invalid,
    );
  });

  it('should propagate a lost rotation race', async () => {
    userSessionService.rotateSession.mockRejectedValue(invalid);

    await expect(service.refreshToken('current-token', CLIENT)).rejects.toThrow(
      invalid,
    );
  });
});
