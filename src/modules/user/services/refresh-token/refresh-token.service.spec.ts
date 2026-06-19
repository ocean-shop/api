import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RefreshTokenService } from './refresh-token.service';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';

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

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };

    userSessionRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      verify: jest.fn().mockReturnValue({ sub: 'uuid' }),
      sign: jest.fn().mockReturnValue('new-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(UserSession),
          useValue: userSessionRepository,
        },
        { provide: JwtService, useValue: jwtService },
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
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is invalid (empty)', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid' });
      userSessionRepository.find.mockResolvedValue([]);

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid' });
      const session = {
        expiresAt: new Date(Date.now() - 10000), // Expired
        refreshTokenHash: 'hash',
      };
      userSessionRepository.find.mockResolvedValue([session]);

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if hash does not match', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid' });
      const session = {
        expiresAt: new Date(Date.now() + 10000),
        refreshTokenHash: 'hash',
      };
      userSessionRepository.find.mockResolvedValue([session]);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.refreshToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should successfully refresh token with default expiration and null agent/ip', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid', role: null });
      const session = {
        expiresAt: new Date(Date.now() + 10000),
        refreshTokenHash: 'hash',
      };
      userSessionRepository.find.mockResolvedValue([session]);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.refreshToken('token');

      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: 'mock-hash',
        }),
      );
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-token');
      expect(result.user.role).toBeNull();
    });

    it('should successfully refresh token with custom expiration and provided agent/ip', async () => {
      process.env.REFRESH_EXPIRE_TIME = '1000000';
      userRepository.findOne.mockResolvedValue({
        id: 'uuid',
        role: { name: 'admin' },
      });
      const session = {
        expiresAt: new Date(Date.now() + 10000),
        refreshTokenHash: 'hash',
      };
      userSessionRepository.find.mockResolvedValue([session]);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.refreshToken('token', 'agent', 'ip');

      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: 'mock-hash',
          userAgent: 'agent',
          ipAddress: 'ip',
        }),
      );
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-token');
      expect(result.user.role).toBe('admin');
    });
  });
});
