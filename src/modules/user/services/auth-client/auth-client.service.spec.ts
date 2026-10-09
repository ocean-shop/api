import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthClientService } from './auth-client.service';
import { AuthService } from '../auth/auth.service';
import { RequestOtpService } from '../request-otp/request-otp.service';
import { AuthClientRepository } from '../../repositories/auth-client/auth-client.repository';
import { OtpPurpose } from '../../entities/enums/auth-otp.enum';

describe('AuthClientService', () => {
  let service: AuthClientService;
  let authClientRepository: any;
  let authService: any;
  let requestOtpService: any;

  beforeEach(async () => {
    authClientRepository = {
      findByEmailOrPhone: jest.fn().mockResolvedValue(null),
      findRoleByName: jest
        .fn()
        .mockResolvedValue({ id: 'role-user', name: 'user' }),
      createUser: jest
        .fn()
        .mockImplementation((payload) =>
          Promise.resolve({ id: 'new-uuid', ...payload }),
        ),
      createSession: jest.fn().mockResolvedValue(undefined),
    };

    authService = {
      checkActiveOtpRequest: jest.fn(),
      isUserVerified: jest.fn(),
      findAndValidateLatestOtp: jest.fn(),
      validateOtpCode: jest.fn().mockResolvedValue(undefined),
      saveAuthOtp: jest.fn().mockResolvedValue(undefined),
      verifyUserIfRegistered: jest.fn().mockResolvedValue(undefined),
      generateTokens: jest
        .fn()
        .mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' }),
    };

    requestOtpService = {
      createAndSendOtp: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthClientService,
        { provide: AuthClientRepository, useValue: authClientRepository },
        { provide: AuthService, useValue: authService },
        { provide: RequestOtpService, useValue: requestOtpService },
      ],
    }).compile();

    service = module.get<AuthClientService>(AuthClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should throw BadRequestException if login is neither email nor phone', async () => {
      await expect(
        service.requestOtp({ login: 'not-a-contact' }),
      ).rejects.toThrow(BadRequestException);
      expect(authClientRepository.findByEmailOrPhone).not.toHaveBeenCalled();
    });

    it('should send LOGIN OTP by email to an existing verified client', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue({
        id: 'uuid',
        isActive: true,
        role: { name: 'user' },
      });
      authService.isUserVerified.mockReturnValue(true);

      const result = await service.requestOtp({ login: 'client@example.com' });

      expect(authClientRepository.findByEmailOrPhone).toHaveBeenCalledWith(
        'client@example.com',
        undefined,
      );
      expect(authService.checkActiveOtpRequest).toHaveBeenCalledWith('uuid');
      expect(requestOtpService.createAndSendOtp).toHaveBeenCalledWith(
        'uuid',
        'client@example.com',
        undefined,
        OtpPurpose.LOGIN,
      );
      expect(authClientRepository.createUser).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP-код успішно надіслано' });
    });

    it('should send REGISTER OTP to an existing unverified client', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue({
        id: 'uuid',
        isActive: true,
        role: { name: 'user' },
      });
      authService.isUserVerified.mockReturnValue(false);

      await service.requestOtp({ login: '+380991112233' });

      expect(authClientRepository.findByEmailOrPhone).toHaveBeenCalledWith(
        undefined,
        '+380991112233',
      );
      expect(requestOtpService.createAndSendOtp).toHaveBeenCalledWith(
        'uuid',
        undefined,
        '+380991112233',
        OtpPurpose.REGISTER,
      );
    });

    it('should throw ForbiddenException if client is blocked', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue({
        id: 'uuid',
        isActive: false,
        role: { name: 'user' },
      });

      await expect(
        service.requestOtp({ login: 'client@example.com' }),
      ).rejects.toThrow(ForbiddenException);
      expect(requestOtpService.createAndSendOtp).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if existing user is not a client', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue({
        id: 'uuid',
        isActive: true,
        role: { name: 'admin' },
      });

      await expect(
        service.requestOtp({ login: 'admin@example.com' }),
      ).rejects.toThrow(new BadRequestException('Доступ заборонено'));
      expect(requestOtpService.createAndSendOtp).not.toHaveBeenCalled();
    });

    it('should create a new client and send REGISTER OTP by phone', async () => {
      const result = await service.requestOtp({ login: '0991112233' });

      expect(authClientRepository.findRoleByName).toHaveBeenCalledWith('user');
      expect(authClientRepository.createUser).toHaveBeenCalledWith({
        email: null,
        mobileNumber: '0991112233',
        isActive: true,
        isEmailVerified: false,
        isMobileVerified: false,
        role: { id: 'role-user', name: 'user' },
      });
      expect(requestOtpService.createAndSendOtp).toHaveBeenCalledWith(
        'new-uuid',
        undefined,
        '0991112233',
        OtpPurpose.REGISTER,
      );
      expect(result).toEqual({ message: 'OTP-код успішно надіслано' });
    });

    it('should throw BadRequestException if client role is missing', async () => {
      authClientRepository.findRoleByName.mockResolvedValue(null);

      await expect(
        service.requestOtp({ login: 'new@example.com' }),
      ).rejects.toThrow(BadRequestException);
      expect(authClientRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    const client = {
      id: 'uuid',
      email: 'client@example.com',
      mobileNumber: null,
      isActive: true,
      role: { name: 'user' },
    };
    const latestOtp = { id: 'otp-id', purpose: OtpPurpose.LOGIN };

    beforeEach(() => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue(client);
      authService.findAndValidateLatestOtp.mockResolvedValue(latestOtp);
    });

    it('should verify OTP, save session and return tokens for a client', async () => {
      const result = await service.verifyOtp(
        { login: 'client@example.com', code: '1234' },
        'agent',
        '127.0.0.1',
      );

      expect(authService.validateOtpCode).toHaveBeenCalledWith(
        '1234',
        latestOtp,
      );
      expect(authService.saveAuthOtp).toHaveBeenCalledWith(
        expect.objectContaining({ usedAt: expect.any(Date) }),
      );
      expect(authService.verifyUserIfRegistered).toHaveBeenCalledWith(
        latestOtp,
        client,
        'client@example.com',
        undefined,
      );
      expect(authClientRepository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid',
          refreshTokenHash: expect.any(String),
          userAgent: 'agent',
          ipAddress: '127.0.0.1',
          expiresAt: expect.any(Date),
        }),
      );
      expect(result).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: 'uuid',
          email: 'client@example.com',
          mobileNumber: null,
          role: 'user',
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ login: '+380991112233', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
      expect(authService.findAndValidateLatestOtp).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not a client', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue({
        ...client,
        role: { name: 'admin' },
      });

      await expect(
        service.verifyOtp({ login: 'admin@example.com', code: '1234' }),
      ).rejects.toThrow(new BadRequestException('Доступ заборонено'));
      expect(authService.findAndValidateLatestOtp).not.toHaveBeenCalled();
      expect(authService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if client is blocked', async () => {
      authClientRepository.findByEmailOrPhone.mockResolvedValue({
        ...client,
        isActive: false,
      });

      await expect(
        service.verifyOtp({ login: 'client@example.com', code: '1234' }),
      ).rejects.toThrow(ForbiddenException);
      expect(authService.generateTokens).not.toHaveBeenCalled();
    });

    it('should not issue tokens if OTP code is invalid', async () => {
      authService.validateOtpCode.mockRejectedValue(
        new BadRequestException('Неправильний OTP-код'),
      );

      await expect(
        service.verifyOtp({ login: 'client@example.com', code: '0000' }),
      ).rejects.toThrow(BadRequestException);
      expect(authService.generateTokens).not.toHaveBeenCalled();
      expect(authClientRepository.createSession).not.toHaveBeenCalled();
    });
  });
});
