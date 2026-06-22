import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { VerifyOtpService } from './verify-otp.service';
import { AuthService } from '../auth/auth.service';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { UserRepository } from '../../repositories/user/user.repository';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('VerifyOtpService', () => {
  let service: VerifyOtpService;
  let userRepository: any;
  let userSessionRepository: any;
  let authService: any;

  beforeEach(async () => {
    userRepository = {
      findByEmailOrPhone: jest.fn(),
    };

    userSessionRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
    };

    authService = {
      findAndValidateLatestOtp: jest.fn().mockResolvedValue({ id: 'otp-id' }),
      validateOtpCode: jest.fn(),
      saveAuthOtp: jest.fn(),
      verifyUserIfRegistered: jest.fn(),
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'mocked-access-token',
        refreshToken: 'mocked-refresh-token',
      }),
    };

    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mockSalt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('mockHash');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyOtpService,
        { provide: UserRepository, useValue: userRepository },
        {
          provide: UserSessionRepository,
          useValue: userSessionRepository,
        },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<VerifyOtpService>(VerifyOtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.REFRESH_EXPIRE_TIME;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOtp', () => {
    it('should throw NotFoundException if user is not found by email', async () => {
      userRepository.findByEmailOrPhone.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.findByEmailOrPhone).toHaveBeenCalledWith(
        'test@example.com',
        undefined,
      );
    });

    it('should throw NotFoundException if user is not found by phone', async () => {
      userRepository.findByEmailOrPhone.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(
        service.verifyOtp({ phone: '1234567890', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.findByEmailOrPhone).toHaveBeenCalledWith(
        undefined,
        '1234567890',
      );
    });

    it('should successfully verify, create tokens and save session with default expiration and null agent/ip', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: null,
      };
      userRepository.findByEmailOrPhone.mockResolvedValue(user);

      const result = await service.verifyOtp({
        email: 'test@example.com',
        code: '1234',
      });

      expect(authService.findAndValidateLatestOtp).toHaveBeenCalledWith('uuid');
      expect(authService.validateOtpCode).toHaveBeenCalled();
      expect(authService.generateTokens).toHaveBeenCalledWith(user);
      expect(userSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          refreshTokenHash: 'mockHash',
          userAgent: null,
          ipAddress: null,
        }),
      );
      expect(userSessionRepository.save).toHaveBeenCalled();
      expect(result.user.role).toBeNull();
    });

    it('should successfully verify, create tokens and save session with custom expiration and provided agent/ip', async () => {
      process.env.REFRESH_EXPIRE_TIME = '1000000';
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: null,
        role: { name: 'admin' },
      };
      userRepository.findByEmailOrPhone.mockResolvedValue(user);

      const result = await service.verifyOtp(
        { email: 'test@example.com', code: '1234' },
        'agent',
        'ip',
      );

      expect(authService.findAndValidateLatestOtp).toHaveBeenCalledWith('uuid');
      expect(authService.validateOtpCode).toHaveBeenCalled();
      expect(authService.generateTokens).toHaveBeenCalledWith(user);
      expect(userSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          refreshTokenHash: 'mockHash',
          userAgent: 'agent',
          ipAddress: 'ip',
        }),
      );
      expect(userSessionRepository.save).toHaveBeenCalled();
      expect(result.user.role).toBe('admin');
    });
  });
});
