import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserSessionService } from './user-session.service';
import { AuthService } from '../auth/auth.service';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import { hashRefreshToken } from '../../helpers/user-session/user-session.helpers';
import { DEFAULT_REFRESH_EXPIRE_MS } from '../../constants/auth.constants';

describe('UserSessionService', () => {
  let service: UserSessionService;
  let userSessionRepository: any;
  let authService: any;
  let configService: { get: jest.Mock };

  const user = {
    id: 'uuid',
    email: 'a@b.c',
    mobileNumber: null,
    role: { name: 'user' },
  } as User;
  const authUser = {
    id: 'uuid',
    email: 'a@b.c',
    mobileNumber: null,
    role: 'user',
  };

  beforeEach(async () => {
    userSessionRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      rotate: jest.fn().mockResolvedValue(true),
      revoke: jest.fn(),
      revokeAllByUserId: jest.fn(),
    };
    authService = {
      generateTokens: jest
        .fn()
        .mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' }),
    };
    configService = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionService,
        { provide: UserSessionRepository, useValue: userSessionRepository },
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<UserSessionService>(UserSessionService);
  });

  describe('startSession', () => {
    it('should bind the tokens to a new session id and store the token hash', async () => {
      const before = Date.now();

      const result = await service.startSession(user, {
        userAgent: 'agent',
        ipAddress: 'ip',
      });

      const [, sessionId] = authService.generateTokens.mock.calls[0] as [
        User,
        string,
      ];
      const created = userSessionRepository.create.mock.calls[0][0];
      expect(sessionId).toEqual(expect.any(String));
      expect(created).toEqual({
        id: sessionId,
        userId: 'uuid',
        refreshTokenHash: hashRefreshToken('refresh'),
        userAgent: 'agent',
        ipAddress: 'ip',
        expiresAt: expect.any(Date),
      });
      expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + DEFAULT_REFRESH_EXPIRE_MS,
      );
      expect(userSessionRepository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: authUser,
      });
    });

    it('should store missing client info as null and use the configured lifetime', async () => {
      configService.get.mockReturnValue('1000');
      const before = Date.now();

      await service.startSession(user, {});

      const created = userSessionRepository.create.mock.calls[0][0];
      expect(created.userAgent).toBeNull();
      expect(created.ipAddress).toBeNull();
      expect(created.expiresAt.getTime()).toBeLessThan(before + 60_000);
    });

    it('should open a different session on every login', async () => {
      await service.startSession(user, {});
      await service.startSession(user, {});

      const [first, second] = userSessionRepository.create.mock.calls.map(
        ([data]: [{ id: string }]) => data.id,
      );
      expect(first).not.toBe(second);
    });
  });

  describe('rotateSession', () => {
    const session = {
      id: 'session-id',
      refreshTokenHash: 'old-hash',
    } as UserSession;

    it('should swap in the new token hash for the same session', async () => {
      const result = await service.rotateSession(session, user, {
        userAgent: 'agent',
      });

      expect(authService.generateTokens).toHaveBeenCalledWith(
        user,
        'session-id',
      );
      expect(userSessionRepository.rotate).toHaveBeenCalledWith({
        sessionId: 'session-id',
        currentHash: 'old-hash',
        nextHash: hashRefreshToken('refresh'),
        expiresAt: expect.any(Date),
        userAgent: 'agent',
      });
      expect(result).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: authUser,
      });
    });

    it('should reject when a parallel refresh rotated the session first', async () => {
      userSessionRepository.rotate.mockResolvedValue(false);

      await expect(service.rotateSession(session, user, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  it('should revoke one session', async () => {
    await service.revokeSession('session-id', 'uuid');

    expect(userSessionRepository.revoke).toHaveBeenCalledWith(
      'session-id',
      'uuid',
    );
  });

  it('should revoke all sessions of a user', async () => {
    await service.revokeAllSessions('uuid');

    expect(userSessionRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'uuid',
    );
  });
});
