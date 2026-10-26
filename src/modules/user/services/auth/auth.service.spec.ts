import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { UserRepository } from '../../repositories/user/user.repository';
import { AuthOtpRepository } from '../../repositories/auth-otp/auth-otp.repository';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let authOtpRepository: any;
  let jwtService: any;

  beforeEach(async () => {
    userRepository = {
      save: jest.fn(),
    };

    authOtpRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
      findActiveOtpRequest: jest.fn(),
      findLatestOtp: jest.fn(),
      reserveAttempt: jest.fn().mockResolvedValue(1),
      markUsed: jest.fn().mockResolvedValue(true),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        { provide: AuthOtpRepository, useValue: authOtpRepository },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('refresh-secret') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtpCodeAndHash', () => {
    it('should generate a code and its hash', async () => {
      const mockSalt = 'mockSalt';
      const mockHash = 'mockHash';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.generateOtpCodeAndHash();

      expect(result.code).toMatch(/^\d{4}$/);
      expect(result.codeHash).toBe(mockHash);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(result.code, mockSalt);
    });
  });

  describe('saveOtp', () => {
    it('should save OTP with email channel', async () => {
      await service.saveOtp(
        'userId1',
        'hash1',
        'test@example.com',
        OtpPurpose.LOGIN,
      );
      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'userId1',
          codeHash: 'hash1',
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.LOGIN,
        }),
      );
      expect(authOtpRepository.save).toHaveBeenCalled();
    });

    it('should save OTP with SMS channel if email is not provided', async () => {
      await service.saveOtp('userId1', 'hash1', undefined, OtpPurpose.LOGIN);
      expect(authOtpRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'userId1',
          codeHash: 'hash1',
          channel: OtpChannel.SMS,
          purpose: OtpPurpose.LOGIN,
        }),
      );
      expect(authOtpRepository.save).toHaveBeenCalled();
    });
  });

  describe('isUserVerified', () => {
    it('should return true if email is provided and isEmailVerified is true', () => {
      const user = { isEmailVerified: true, isMobileVerified: false } as User;
      expect(service.isUserVerified(user, 'test@example.com', undefined)).toBe(
        true,
      );
    });

    it('should return false if email is provided and isEmailVerified is false', () => {
      const user = { isEmailVerified: false, isMobileVerified: false } as User;
      expect(service.isUserVerified(user, 'test@example.com', undefined)).toBe(
        false,
      );
    });

    it('should return true if phone is provided and isMobileVerified is true', () => {
      const user = { isEmailVerified: false, isMobileVerified: true } as User;
      expect(service.isUserVerified(user, undefined, '1234567890')).toBe(true);
    });

    it('should return false if neither email nor phone is provided', () => {
      const user = { isEmailVerified: true, isMobileVerified: true } as User;
      expect(service.isUserVerified(user, undefined, undefined)).toBe(false);
    });
  });

  describe('checkActiveOtpRequest', () => {
    it('should not throw if no active OTP is found', async () => {
      authOtpRepository.findActiveOtpRequest.mockResolvedValue(null);
      await expect(
        service.checkActiveOtpRequest('userId1'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if active OTP is found', async () => {
      authOtpRepository.findActiveOtpRequest.mockResolvedValue({ id: 1 });
      await expect(service.checkActiveOtpRequest('userId1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAndValidateLatestOtp', () => {
    it('should throw BadRequestException if no OTP is found', async () => {
      authOtpRepository.findLatestOtp.mockResolvedValue(null);
      await expect(service.findAndValidateLatestOtp('userId1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      authOtpRepository.findLatestOtp.mockResolvedValue({
        expiresAt: new Date(Date.now() - 10000),
      });
      await expect(service.findAndValidateLatestOtp('userId1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return OTP if valid', async () => {
      const validOtp = { expiresAt: new Date(Date.now() + 10000) };
      authOtpRepository.findLatestOtp.mockResolvedValue(validOtp);
      const result = await service.findAndValidateLatestOtp('userId1');
      expect(result).toBe(validOtp);
    });
  });

  describe('consumeOtp', () => {
    const otp = { id: 'otp-id', codeHash: 'hash1' } as AuthOtp;

    it('should reserve an attempt, check the code and mark it used', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.consumeOtp('1234', otp)).resolves.toBeUndefined();

      expect(authOtpRepository.reserveAttempt).toHaveBeenCalledWith(
        'otp-id',
        5,
        expect.any(Date),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hash1');
      expect(authOtpRepository.markUsed).toHaveBeenCalledWith('otp-id');
    });

    it('should block for five minutes from the attempt', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const before = Date.now();

      await service.consumeOtp('1234', otp);

      const blockedUntil = (
        authOtpRepository.reserveAttempt.mock.calls[0] as [string, number, Date]
      )[2];
      expect(blockedUntil.getTime()).toBeGreaterThanOrEqual(
        before + 5 * 60 * 1000,
      );
    });

    it('should reject without checking the code while it is blocked', async () => {
      authOtpRepository.reserveAttempt.mockResolvedValue(null);

      await expect(service.consumeOtp('1234', otp)).rejects.toThrow(
        'Забагато спроб. Спробуйте знову через 5 хвилин.',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(authOtpRepository.markUsed).not.toHaveBeenCalled();
    });

    it('should reject a wrong code without using it', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      authOtpRepository.reserveAttempt.mockResolvedValue(2);

      await expect(service.consumeOtp('0000', otp)).rejects.toThrow(
        'Неправильний OTP-код',
      );
      expect(authOtpRepository.markUsed).not.toHaveBeenCalled();
    });

    it('should report the block on the attempt that reaches the limit', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      authOtpRepository.reserveAttempt.mockResolvedValue(5);

      await expect(service.consumeOtp('0000', otp)).rejects.toThrow(
        'Забагато спроб. Спробуйте знову через 5 хвилин.',
      );
    });

    it('should reject a code a parallel request has already used', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      authOtpRepository.markUsed.mockResolvedValue(false);

      await expect(service.consumeOtp('1234', otp)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyUserIfRegistered', () => {
    it('should verify email if purpose is REGISTER and email is provided', async () => {
      const otp = { purpose: OtpPurpose.REGISTER } as AuthOtp;
      const user = { isEmailVerified: false } as User;

      await service.verifyUserIfRegistered(
        otp,
        user,
        'test@example.com',
        undefined,
      );

      expect(user.isEmailVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should verify phone if purpose is REGISTER and phone is provided', async () => {
      const otp = { purpose: OtpPurpose.REGISTER } as AuthOtp;
      const user = { isMobileVerified: false } as User;

      await service.verifyUserIfRegistered(otp, user, undefined, '1234567890');

      expect(user.isMobileVerified).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should not verify if purpose is not REGISTER', async () => {
      const otp = { purpose: OtpPurpose.LOGIN } as AuthOtp;
      const user = { isEmailVerified: false } as User;

      await service.verifyUserIfRegistered(
        otp,
        user,
        'test@example.com',
        undefined,
      );

      expect(user.isEmailVerified).toBe(false);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('generateTokens', () => {
    const user = {
      id: 'uuid',
      email: 'test@example.com',
      mobileNumber: '1234567890',
      role: { name: 'admin' },
    } as User;

    it('should sign a typed access token and a session-bound refresh token', () => {
      const result = service.generateTokens(user, 'session-id');

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'uuid',
          email: 'test@example.com',
          role: 'admin',
          mobileNumber: '1234567890',
          type: 'access',
        },
        { expiresIn: '15m' },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'uuid', sid: 'session-id', type: 'refresh' },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
          jwtid: expect.any(String),
        },
      );
      expect(result).toEqual({
        accessToken: 'mocked-token',
        refreshToken: 'mocked-token',
      });
    });

    it('should give every refresh token a unique id', () => {
      service.generateTokens(user, 'session-id');
      service.generateTokens(user, 'session-id');

      const jwtIds = jwtService.sign.mock.calls
        .map(([, options]) => (options as { jwtid?: string }).jwtid)
        .filter(Boolean);
      expect(new Set(jwtIds).size).toBe(2);
    });
  });

  describe('verifyRefreshToken', () => {
    const payload = { sub: 'uuid', sid: 'session-id', type: 'refresh' };

    it('should verify with the refresh secret and return the payload', () => {
      jwtService.verify.mockReturnValue(payload);

      expect(service.verifyRefreshToken('token')).toEqual(payload);
      expect(jwtService.verify).toHaveBeenCalledWith('token', {
        secret: 'refresh-secret',
        ignoreExpiration: undefined,
      });
    });

    it('should pass ignoreExpiration through', () => {
      jwtService.verify.mockReturnValue(payload);

      service.verifyRefreshToken('token', { ignoreExpiration: true });

      expect(jwtService.verify).toHaveBeenCalledWith('token', {
        secret: 'refresh-secret',
        ignoreExpiration: true,
      });
    });

    it('should reject a token with a bad signature or expiry', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() => service.verifyRefreshToken('token')).toThrow(
        UnauthorizedException,
      );
    });

    it.each([
      ['an access token', { sub: 'uuid', type: 'access' }],
      ['a legacy token without a session', { sub: 'uuid', type: 'refresh' }],
    ])('should reject %s', (_label, claims) => {
      jwtService.verify.mockReturnValue(claims);

      expect(() => service.verifyRefreshToken('token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('with real JWT signing', () => {
    it('should keep access and refresh tokens from passing as each other', () => {
      const realJwt = new JwtService({ secret: 'access-secret' });
      const realService = new AuthService(
        userRepository,
        authOtpRepository,
        realJwt,
        {
          getOrThrow: () => 'refresh-secret',
        } as unknown as ConfigService,
      );
      const { accessToken, refreshToken } = realService.generateTokens(
        { id: 'uuid', email: null, mobileNumber: null } as User,
        'session-id',
      );

      // The access guard verifies with the default (access) secret.
      expect(() => realJwt.verify(refreshToken)).toThrow();
      expect(() => realService.verifyRefreshToken(accessToken)).toThrow(
        UnauthorizedException,
      );
      expect(realService.verifyRefreshToken(refreshToken)).toMatchObject({
        sub: 'uuid',
        sid: 'session-id',
        type: 'refresh',
      });
    });
  });
});
