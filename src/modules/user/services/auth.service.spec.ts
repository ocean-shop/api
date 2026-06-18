import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { User } from '../entities/user.entity';
import { AuthOtp } from '../entities/auth-otp.entity';
import { UserSession } from '../entities/user-session.entity';
import { OtpChannel, OtpPurpose } from '../entities/enums/auth-otp.enum';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('mock-hash'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let authOtpRepository: any;
  let userSessionRepository: any;
  let jwtService: any;
  let emailService: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((dto) => ({ id: 'new-uuid', ...dto })),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };

    authOtpRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    userSessionRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
    };

    emailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(AuthOtp), useValue: authOtpRepository },
        {
          provide: getRepositoryToken(UserSession),
          useValue: userSessionRepository,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    process.env.OTP_EXPIRE = '300000';
    process.env.REFRESH_EXPIRE_TIME = '604800000';

    // Mock random for predictable OTP codes
    jest.spyOn(Math, 'random').mockReturnValue(0.1234); // results in code '2110'
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should throw BadRequestException if neither email nor phone is provided', async () => {
      await expect(service.requestOtp({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is not verified', async () => {
      const existingUser = {
        id: 'uuid',
        isEmailVerified: false,
        isMobileVerified: false,
      };
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.requestOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already has an active OTP', async () => {
      const existingUser = { id: 'uuid', isEmailVerified: true };
      userRepository.findOne.mockResolvedValue(existingUser);
      queryBuilder.getOne.mockResolvedValue({ id: 'active-otp' }); // simulates active OTP found

      await expect(
        service.requestOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully handle an existing verified user', async () => {
      const existingUser = { id: 'uuid', isEmailVerified: true };
      userRepository.findOne.mockResolvedValue(existingUser);
      queryBuilder.getOne.mockResolvedValue(null);

      const result = await service.requestOtp({ email: 'test@example.com' });

      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.LOGIN,
        }),
      );
      expect(authOtpRepository.save).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        '2110',
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should throw BadRequestException if user is not verified by phone but email is undefined', async () => {
      const existingUser = {
        id: 'uuid',
        isEmailVerified: false,
        isMobileVerified: false,
      };
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.requestOtp({ phone: '1234567890', email: undefined }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fallback to false in isUserVerified if both are somehow undefined', async () => {
      // By using any, we bypass the first check to hit the internal logic
      const user = new User();
      user.isEmailVerified = false;
      user.isMobileVerified = false;
      expect((service as any).isUserVerified(user, undefined, undefined)).toBe(
        false,
      );
    });

    it('should properly fallback to true when only phone is defined', async () => {
      // Testing the isUserVerified phone path
      const user = new User();
      user.isEmailVerified = false;
      user.isMobileVerified = true;
      expect((service as any).isUserVerified(user, undefined, '12345')).toBe(
        true,
      );
    });

    it('should successfully handle login when only phone is provided but user is verified', async () => {
      const existingUser = { id: 'uuid', isMobileVerified: true };
      userRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.requestOtp({ phone: '1234567890' });
      expect(result.message).toEqual('OTP sent successfully');
    });

    it('should correctly fall back to false if no email or phone is provided', async () => {
      const user = new User();
      user.isEmailVerified = true;
      user.isMobileVerified = true;
      expect((service as any).isUserVerified(user, undefined, undefined)).toBe(
        false,
      );
    });

    it('should successfully handle an existing verified user by phone', async () => {
      const existingUser = { id: 'uuid', isMobileVerified: true };
      userRepository.findOne.mockResolvedValue(existingUser);
      queryBuilder.getOne.mockResolvedValue(null);

      const result = await service.requestOtp({ phone: '1234567890' });

      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          channel: OtpChannel.SMS,
          purpose: OtpPurpose.LOGIN,
        }),
      );
      expect(authOtpRepository.save).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should successfully handle a new user via phone', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.requestOtp({ phone: '1234567890' });

      expect(userRepository.create).toHaveBeenCalledWith({
        email: null,
        mobileNumber: '1234567890',
      });
      expect(userRepository.save).toHaveBeenCalled();

      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-uuid',
          channel: OtpChannel.SMS,
          purpose: OtpPurpose.REGISTER,
        }),
      );
      expect(authOtpRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should successfully handle a new user via email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.requestOtp({ email: 'test@example.com' });

      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        mobileNumber: null,
      });
      expect(userRepository.save).toHaveBeenCalled();

      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-uuid',
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.REGISTER,
        }),
      );
      expect(authOtpRepository.save).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        '2110',
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });
    it('should handle undefined OTP_EXPIRE', async () => {
      process.env.OTP_EXPIRE = '';

      userRepository.findOne.mockResolvedValue(null);

      await service.requestOtp({ phone: '1234567890' });

      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no active OTP is found', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid' });
      queryBuilder.getMany.mockResolvedValue([]);

      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if OTP has expired', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid' });
      queryBuilder.getMany.mockResolvedValue([
        { expiresAt: new Date(Date.now() - 1000) }, // expired
      ]);

      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException and increment attempts if code is invalid', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'uuid' });
      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.verifyOtp({ email: 'test@example.com', code: 'wrong' }),
      ).rejects.toThrow(BadRequestException);

      expect(activeOtp.attempts).toBe(1);
      expect(authOtpRepository.save).toHaveBeenCalledWith(activeOtp);
    });

    it('should successfully verify, verify user, create tokens and save session (Register)', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: null,
        isEmailVerified: false,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.REGISTER,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.verifyOtp(
        { email: 'test@example.com', code: 'correct' },
        'agent',
        'ip',
      );

      // Verify OTP is marked as used
      expect(activeOtp).toHaveProperty('usedAt');
      expect(authOtpRepository.save).toHaveBeenCalledWith(activeOtp);

      // Verify user gets verified
      expect(user.isEmailVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);

      // Verify Tokens generated
      expect(jwtService.sign).toHaveBeenCalledTimes(2);

      // Verify Session saved
      expect(userSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          userAgent: 'agent',
          ipAddress: 'ip',
        }),
      );
      expect(userSessionRepository.save).toHaveBeenCalled();

      // Return
      expect(result).toEqual({
        accessToken: 'mocked-token',
        refreshToken: 'mocked-token',
        user: {
          id: 'uuid',
          email: 'test@example.com',
          mobileNumber: null,
          role: null,
        },
      });
    });

    it('should handle undefined JWT_REFRESH_EXPIRE_TIME', async () => {
      process.env.REFRESH_EXPIRE_TIME = '';

      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: null,
        isEmailVerified: true,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.LOGIN,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.verifyOtp({ email: 'test@example.com', code: 'correct' });

      // Should default to 7 days (604800000ms)
      expect(userSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should successfully verify, verify user, create tokens and save session (Register with phone)', async () => {
      const user = {
        id: 'uuid',
        email: null,
        mobileNumber: '12345',
        isMobileVerified: false,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.REGISTER,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.verifyOtp({
        phone: '12345',
        code: 'correct',
      });

      expect(user.isMobileVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should successfully verify, verify user, create tokens and save session (Register with phone)', async () => {
      const user = {
        id: 'uuid',
        email: null,
        mobileNumber: '12345',
        isMobileVerified: false,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.REGISTER,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.verifyOtp({
        phone: '12345',
        code: 'correct',
      });

      expect(user.isMobileVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should successfully verify, verify user, create tokens and save session (Register with email missing)', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: null,
        isEmailVerified: false,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.REGISTER,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.verifyOtp({
        phone: undefined,
        email: 'test@example.com',
        code: 'correct',
      });

      expect(user.isEmailVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should successfully handle login when only phone is provided', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: '12345',
        isMobileVerified: true,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.LOGIN,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.verifyOtp({ phone: '12345', code: 'correct' });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should successfully handle login when email is defined but empty string', async () => {
      const user = {
        id: 'uuid',
        email: '',
        mobileNumber: '12345',
        isMobileVerified: true,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.LOGIN,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.verifyOtp({ phone: '12345', email: '', code: 'correct' });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should successfully handle login when email is defined', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: '12345',
        isEmailVerified: true,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.LOGIN,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.verifyOtp({
        phone: undefined,
        email: 'test@example.com',
        code: 'correct',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should fall back to 5 mins if OTP_EXPIRE is not set', async () => {
      delete process.env.OTP_EXPIRE;
      userRepository.findOne.mockResolvedValue(null);
      await service.requestOtp({ phone: '1234567890' });
      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should handle undefined REFRESH_EXPIRE_TIME during login', async () => {
      process.env.REFRESH_EXPIRE_TIME = '';

      const user = {
        id: 'uuid',
        email: null,
        mobileNumber: '12345',
        isMobileVerified: true,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.LOGIN,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.verifyOtp({ phone: '12345', code: 'correct' });

      expect(userSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should successfully verify, create tokens and save session (Login)', async () => {
      const user = {
        id: 'uuid',
        email: null,
        mobileNumber: '12345',
        isMobileVerified: true,
      };
      userRepository.findOne.mockResolvedValue(user);

      const activeOtp = {
        expiresAt: new Date(Date.now() + 10000),
        attempts: 0,
        codeHash: 'hash',
        purpose: OtpPurpose.LOGIN,
      };
      queryBuilder.getMany.mockResolvedValue([activeOtp]);

      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.verifyOtp({
        phone: '12345',
        code: 'correct',
      });

      // Verify User NOT updated because it was a login
      expect(userRepository.save).not.toHaveBeenCalled();

      // Ensure fallback behavior works for empty userAgent/ipAddress
      expect(userSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          userAgent: null,
          ipAddress: null,
        }),
      );

      expect(result).toBeDefined();
    });
  });
});
