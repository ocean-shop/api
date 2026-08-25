import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestOtpService } from './request-otp.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user/user.repository';

describe('RequestOtpService', () => {
  let service: RequestOtpService;
  let userRepository: any;
  let authService: any;
  let emailService: any;
  let smsService: any;

  beforeEach(async () => {
    userRepository = {
      findByEmailOrPhone: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((dto) => ({ id: 'new-uuid', ...dto })),
      save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    };

    authService = {
      checkActiveOtpRequest: jest.fn(),
      isUserVerified: jest.fn(),
      generateOtpCodeAndHash: jest
        .fn()
        .mockResolvedValue({ code: '1234', codeHash: 'hash' }),
      saveOtp: jest.fn(),
    };

    emailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    smsService = {
      sendOtpSms: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestOtpService,
        { provide: UserRepository, useValue: userRepository },
        { provide: AuthService, useValue: authService },
        { provide: EmailService, useValue: emailService },
        { provide: SmsService, useValue: smsService },
      ],
    }).compile();

    service = module.get<RequestOtpService>(RequestOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestAdminOtp', () => {
    it('should throw BadRequestException if neither email nor phone is provided', async () => {
      await expect(service.requestAdminOtp({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user is not found by email', async () => {
      userRepository.findByEmailOrPhone.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(
        service.requestAdminOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not found by phone', async () => {
      userRepository.findByEmailOrPhone.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      await expect(
        service.requestAdminOtp({ phone: '1234567890' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not an admin', async () => {
      const existingUser = {
        id: 'uuid',
        role: { name: 'user' },
      };
      userRepository.findByEmailOrPhone.mockResolvedValue(existingUser);

      await expect(
        service.requestAdminOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(new BadRequestException('Access denied'));
    });

    it('should throw BadRequestException if user is not verified', async () => {
      const existingUser = {
        id: 'uuid',
        role: { name: 'admin' },
      };
      userRepository.findByEmailOrPhone.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(false);

      await expect(
        service.requestAdminOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(new BadRequestException('User not found'));
    });

    it('should successfully handle an existing verified user with email', async () => {
      const existingUser = { id: 'uuid', role: { name: 'admin' } };
      userRepository.findByEmailOrPhone.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(true);

      const result = await service.requestAdminOtp({
        email: 'test@example.com',
      });

      expect(authService.saveOtp).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        '1234',
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should successfully handle an existing verified user with phone', async () => {
      const existingUser = { id: 'uuid', role: { name: 'admin' } };
      userRepository.findByEmailOrPhone.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(true);

      const result = await service.requestAdminOtp({ phone: '1234567890' });

      expect(authService.saveOtp).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
      expect(smsService.sendOtpSms).toHaveBeenCalledWith('1234567890', '1234');
      expect(smsService.sendOtpSms).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should throw if SMS sending fails for phone flow', async () => {
      const existingUser = { id: 'uuid', role: { name: 'admin' } };
      userRepository.findByEmailOrPhone.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(true);
      smsService.sendOtpSms.mockRejectedValue(new Error('TurboSMS failed'));

      await expect(
        service.requestAdminOtp({ phone: '1234567890' }),
      ).rejects.toThrow('TurboSMS failed');
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
    });
  });
});
