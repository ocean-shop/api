import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { VerifyOtpService } from './verify-otp.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('VerifyOtpService', () => {
  let service: VerifyOtpService;
  let userRepository: any;
  let userSessionRepository: any;
  let jwtService: any;
  let authService: any;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };

    userSessionRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
    };

    authService = {
      findAndValidateLatestOtp: jest.fn().mockResolvedValue({ id: 'otp-id' }),
      validateOtpCode: jest.fn(),
      saveAuthOtp: jest.fn(),
      verifyUserIfRegistered: jest.fn(),
    };

    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mockSalt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('mockHash');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyOtpService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(UserSession),
          useValue: userSessionRepository,
        },
        { provide: JwtService, useValue: jwtService },
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
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyOtp({ email: 'test@example.com', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: { role: true },
      });
    });

    it('should throw NotFoundException if user is not found by phone', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyOtp({ phone: '1234567890', code: '1234' }),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { mobileNumber: '1234567890' },
        relations: { role: true },
      });
    });

    it('should successfully verify, create tokens and save session with default expiration and null agent/ip', async () => {
      const user = {
        id: 'uuid',
        email: 'test@example.com',
        mobileNumber: null,
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.verifyOtp({
        email: 'test@example.com',
        code: '1234',
      });

      expect(authService.findAndValidateLatestOtp).toHaveBeenCalledWith('uuid');
      expect(authService.validateOtpCode).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
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
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.verifyOtp(
        { email: 'test@example.com', code: '1234' },
        'agent',
        'ip',
      );

      expect(authService.findAndValidateLatestOtp).toHaveBeenCalledWith('uuid');
      expect(authService.validateOtpCode).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
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
