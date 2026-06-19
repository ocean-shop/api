import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let authOtpRepository: any;

  beforeEach(async () => {
    userRepository = {
      save: jest.fn(),
    };

    authOtpRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(AuthOtp), useValue: authOtpRepository },
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
    let queryBuilder: any;

    beforeEach(() => {
      queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      authOtpRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    });

    it('should not throw if no active OTP is found', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      await expect(
        service.checkActiveOtpRequest('userId1'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if active OTP is found', async () => {
      queryBuilder.getOne.mockResolvedValue({ id: 1 });
      await expect(service.checkActiveOtpRequest('userId1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAndValidateLatestOtp', () => {
    let queryBuilder: any;

    beforeEach(() => {
      queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };
      authOtpRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    });

    it('should throw BadRequestException if no OTP is found', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      await expect(service.findAndValidateLatestOtp('userId1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      queryBuilder.getMany.mockResolvedValue([
        { expiresAt: new Date(Date.now() - 10000) },
      ]);
      await expect(service.findAndValidateLatestOtp('userId1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return OTP if valid', async () => {
      const validOtp = { expiresAt: new Date(Date.now() + 10000) };
      queryBuilder.getMany.mockResolvedValue([validOtp]);
      const result = await service.findAndValidateLatestOtp('userId1');
      expect(result).toBe(validOtp);
    });
  });

  describe('validateOtpCode', () => {
    it('should throw BadRequestException and increment attempts if invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const otp = { codeHash: 'hash1', attempts: 0 } as AuthOtp;

      await expect(service.validateOtpCode('1234', otp)).rejects.toThrow(
        BadRequestException,
      );
      expect(otp.attempts).toBe(1);
      expect(authOtpRepository.save).toHaveBeenCalledWith(otp);
    });

    it('should not throw if valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const otp = { codeHash: 'hash1', attempts: 0 } as AuthOtp;

      await expect(service.validateOtpCode('1234', otp)).resolves.not.toThrow();
      expect(otp.attempts).toBe(0);
      expect(authOtpRepository.save).not.toHaveBeenCalled();
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

  describe('saveAuthOtp', () => {
    it('should save the OTP', async () => {
      const otp = { id: 'otp1' } as AuthOtp;
      await service.saveAuthOtp(otp);
      expect(authOtpRepository.save).toHaveBeenCalledWith(otp);
    });
  });
});
