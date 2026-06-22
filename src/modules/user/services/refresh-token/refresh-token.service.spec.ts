import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RefreshTokenService } from './refresh-token.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { AuthService } from '../auth/auth.service';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('mock-hash'),
  compare: jest.fn(),
}));

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let userRepository: any;
  let userSessionRepository: any;
  let jwtService: any;
  let authService: any;

  beforeEach(async () => {
    userRepository = {
      findById: jest.fn(),
    };

    userSessionRepository = {
      findActiveSessionsByUserId: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      verify: jest.fn().mockReturnValue({ sub: 'uuid' }),
    };

    authService = {
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: UserRepository, useValue: userRepository },
        {
          provide: UserSessionRepository,
          useValue: userSessionRepository,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.REFRESH_EXPIRE_TIME;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if token is missing', async () => {
      await expect(service.refreshToken('')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findById.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );
      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is invalid (empty)', async () => {
      userRepository.findById.mockResolvedValue({ id: 'uuid' });
      userSessionRepository.findActiveSessionsByUserId.mockResolvedValue([]);

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      userRepository.findById.mockResolvedValue({ id: 'uuid' });
      const session = {
        expiresAt: new Date(Date.now() - 10000), // Expired
        refreshTokenHash: 'hash',
      };
      userSessionRepository.findActiveSessionsByUserId.mockResolvedValue([
        session,
      ]);

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if hash does not match', async () => {
      userRepository.findById.mockResolvedValue({ id: 'uuid' });
      const session = {
        expiresAt: new Date(Date.now() + 10000),
        refreshTokenHash: 'hash',
      };
      userSessionRepository.findActiveSessionsByUserId.mockResolvedValue([
        session,
      ]);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should successfully refresh token with default expiration and null agent/ip', async () => {
      userRepository.findById.mockResolvedValue({ id: 'uuid', role: null });
      const session = {
        expiresAt: new Date(Date.now() + 10000),
        refreshTokenHash: 'hash',
      };
      userSessionRepository.findActiveSessionsByUserId.mockResolvedValue([
        session,
      ]);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.refreshToken('token');

      expect(authService.generateTokens).toHaveBeenCalledWith({
        id: 'uuid',
        role: null,
      });
      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: 'mock-hash',
        }),
      );
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user.role).toBeNull();
    });

    it('should successfully refresh token with custom expiration and provided agent/ip', async () => {
      process.env.REFRESH_EXPIRE_TIME = '1000000';
      userRepository.findById.mockResolvedValue({
        id: 'uuid',
        role: { name: 'admin' },
      });
      const session = {
        expiresAt: new Date(Date.now() + 10000),
        refreshTokenHash: 'hash',
      };
      userSessionRepository.findActiveSessionsByUserId.mockResolvedValue([
        session,
      ]);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.refreshToken('token', 'agent', 'ip');

      expect(authService.generateTokens).toHaveBeenCalledWith({
        id: 'uuid',
        role: { name: 'admin' },
      });
      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: 'mock-hash',
          userAgent: 'agent',
          ipAddress: 'ip',
        }),
      );
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user.role).toBe('admin');
    });
  });
});
