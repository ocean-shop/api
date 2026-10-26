import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VerifyOtpService } from './verify-otp.service';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../user-session/user-session.service';
import { UserRepository } from '../../repositories/user/user.repository';

describe('VerifyOtpService', () => {
  let service: VerifyOtpService;
  let userRepository: any;
  let authService: any;
  let userSessionService: any;

  const session = {
    accessToken: 'access',
    refreshToken: 'refresh',
    user: {
      id: 'uuid',
      email: 'test@example.com',
      mobileNumber: null,
      role: 'admin',
    },
  };

  const adminOf = (overrides: Record<string, unknown> = {}) => ({
    id: 'uuid',
    email: 'test@example.com',
    mobileNumber: null,
    isActive: true,
    role: { name: 'admin' },
    ...overrides,
  });

  beforeEach(async () => {
    userRepository = {
      findByEmailOrPhone: jest.fn(),
    };

    authService = {
      findAndValidateLatestOtp: jest.fn().mockResolvedValue({ id: 'otp-id' }),
      consumeOtp: jest.fn(),
      verifyUserIfRegistered: jest.fn(),
    };

    userSessionService = {
      startSession: jest.fn().mockResolvedValue(session),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyOtpService,
        { provide: UserRepository, useValue: userRepository },
        { provide: AuthService, useValue: authService },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    }).compile();

    service = module.get<VerifyOtpService>(VerifyOtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOtp', () => {
    it('should throw NotFoundException if user is not found by email', async () => {
      userRepository.findByEmailOrPhone.mockRejectedValue(
        new NotFoundException('Користувача не знайдено'),
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
        new NotFoundException('Користувача не знайдено'),
      );
      await expect(
        service.verifyOtp({ phone: '1234567890', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.findByEmailOrPhone).toHaveBeenCalledWith(
        undefined,
        '1234567890',
      );
    });

    it('should reject a non-admin user before touching the OTP', async () => {
      userRepository.findByEmailOrPhone.mockResolvedValue(
        adminOf({ role: { name: 'user' } }),
      );

      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(BadRequestException);
      expect(authService.consumeOtp).not.toHaveBeenCalled();
      expect(userSessionService.startSession).not.toHaveBeenCalled();
    });

    it('should reject a blocked admin', async () => {
      userRepository.findByEmailOrPhone.mockResolvedValue(
        adminOf({ isActive: false }),
      );

      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(ForbiddenException);
      expect(userSessionService.startSession).not.toHaveBeenCalled();
    });

    it('should not open a session when the code is wrong', async () => {
      userRepository.findByEmailOrPhone.mockResolvedValue(adminOf());
      authService.consumeOtp.mockRejectedValue(new BadRequestException());

      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '0000' }),
      ).rejects.toThrow(BadRequestException);
      expect(userSessionService.startSession).not.toHaveBeenCalled();
    });

    it('should consume the code and open a session', async () => {
      const user = adminOf();
      const otp = { id: 'otp-id' };
      userRepository.findByEmailOrPhone.mockResolvedValue(user);

      const result = await service.verifyOtp(
        { email: 'test@example.com', code: '1234' },
        'agent',
        'ip',
      );

      expect(authService.findAndValidateLatestOtp).toHaveBeenCalledWith('uuid');
      expect(authService.consumeOtp).toHaveBeenCalledWith('1234', otp);
      expect(authService.verifyUserIfRegistered).toHaveBeenCalledWith(
        otp,
        user,
        'test@example.com',
        undefined,
      );
      expect(userSessionService.startSession).toHaveBeenCalledWith(user, {
        userAgent: 'agent',
        ipAddress: 'ip',
      });
      expect(result).toBe(session);
    });
  });
});
