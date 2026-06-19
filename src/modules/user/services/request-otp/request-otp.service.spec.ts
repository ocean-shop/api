import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { RequestOtpService } from './request-otp.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { User } from '../../entities/user.entity';

describe('RequestOtpService', () => {
  let service: RequestOtpService;
  let userRepository: any;
  let authService: any;
  let emailService: any;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestOtpService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: AuthService, useValue: authService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<RequestOtpService>(RequestOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should throw BadRequestException if neither email nor phone is provided', async () => {
      await expect(service.requestOtp({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is not found by email', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.requestOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(new BadRequestException('User not found'));
    });

    it('should throw BadRequestException if user is not found by phone', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.requestOtp({ phone: '1234567890' })).rejects.toThrow(
        new BadRequestException('User not found'),
      );
    });

    it('should throw BadRequestException if user is not an admin', async () => {
      const existingUser = {
        id: 'uuid',
        role: { name: 'user' },
      };
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.requestOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(new BadRequestException('Access denied'));
    });

    it('should throw BadRequestException if user is not verified', async () => {
      const existingUser = {
        id: 'uuid',
        role: { name: 'admin' },
      };
      userRepository.findOne.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(false);

      await expect(
        service.requestOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(new BadRequestException('User not found'));
    });

    it('should successfully handle an existing verified user with email', async () => {
      const existingUser = { id: 'uuid', role: { name: 'admin' } };
      userRepository.findOne.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(true);

      const result = await service.requestOtp({ email: 'test@example.com' });

      expect(authService.saveOtp).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        '1234',
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });

    it('should successfully handle an existing verified user with phone', async () => {
      const existingUser = { id: 'uuid', role: { name: 'admin' } };
      userRepository.findOne.mockResolvedValue(existingUser);
      authService.isUserVerified.mockReturnValue(true);

      const loggerSpy = jest.spyOn(service['logger'], 'log');

      const result = await service.requestOtp({ phone: '1234567890' });

      expect(authService.saveOtp).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Generated OTP code for 1234567890: 1234',
      );
      expect(result).toEqual({ message: 'OTP sent successfully' });
    });
  });
});
