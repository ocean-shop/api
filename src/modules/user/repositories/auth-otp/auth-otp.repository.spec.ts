import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthOtpRepository } from './auth-otp.repository';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';

describe('AuthOtpRepository', () => {
  let repository: AuthOtpRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthOtpRepository,
        {
          provide: getRepositoryToken(AuthOtp),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<AuthOtpRepository>(AuthOtpRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create an AuthOtp instance', () => {
      const data = {
        userId: 'uuid',
        codeHash: 'hash',
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.LOGIN,
        expiresAt: new Date(),
      };
      const expectedOtp = { id: 'otp-id', ...data } as AuthOtp;
      typeOrmRepository.create.mockReturnValue(expectedOtp);

      const result = repository.create(data);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expectedOtp);
    });
  });

  describe('save', () => {
    it('should save an AuthOtp instance', async () => {
      const otp = { id: 'otp-id', userId: 'uuid' } as AuthOtp;
      typeOrmRepository.save.mockResolvedValue(otp);

      const result = await repository.save(otp);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(otp);
      expect(result).toEqual(otp);
    });
  });

  describe('findActiveOtpRequest', () => {
    it('should find active OTP request', async () => {
      const userId = 'uuid';
      const expectedOtp = { id: 'otp-id', userId } as AuthOtp;

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(expectedOtp),
      };
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findActiveOtpRequest(userId);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('otp');
      expect(queryBuilder.where).toHaveBeenCalledWith('otp.user_id = :userId', {
        userId,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('otp.used_at IS NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'otp.expires_at > :now',
        expect.any(Object),
      );
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(expectedOtp);
    });
  });

  describe('findLatestOtp', () => {
    it('should find the latest OTP', async () => {
      const userId = 'uuid';
      const expectedOtp = { id: 'otp-id', userId } as AuthOtp;

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(expectedOtp),
      };
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findLatestOtp(userId);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('otp');
      expect(queryBuilder.where).toHaveBeenCalledWith('otp.user_id = :userId', {
        userId,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('otp.used_at IS NULL');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'otp.created_at',
        'DESC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(1);
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(expectedOtp);
    });
  });
});
