import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
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

  describe('reserveAttempt', () => {
    const blockedUntil = new Date(1000);

    const mockUpdateBuilder = (raw: unknown[]) => {
      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ raw }),
      };
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      return queryBuilder;
    };

    it('should increment attempts in one update and return the new count', async () => {
      const queryBuilder = mockUpdateBuilder([{ attempts: 3 }]);

      const result = await repository.reserveAttempt('otp-id', 5, blockedUntil);

      expect(result).toBe(3);
      expect(queryBuilder.update).toHaveBeenCalledWith(AuthOtp);
      const [setArg] = queryBuilder.set.mock.calls[0] as [
        Record<string, () => string>,
      ];
      expect(setArg.attempts()).toContain('attempts + 1');
      expect(setArg.blockedUntil()).toContain('>= :limit');
      expect(queryBuilder.where).toHaveBeenCalledWith('id = :id');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('used_at IS NULL');
      expect(queryBuilder.setParameters).toHaveBeenCalledWith({
        id: 'otp-id',
        limit: 5,
        blockedUntil,
        now: expect.any(Date),
      });
      expect(queryBuilder.returning).toHaveBeenCalledWith(['attempts']);
    });

    it('should return null when no row could be updated', async () => {
      mockUpdateBuilder([]);

      await expect(
        repository.reserveAttempt('otp-id', 5, blockedUntil),
      ).resolves.toBeNull();
    });
  });

  describe('markUsed', () => {
    beforeEach(() => {
      typeOrmRepository.update = jest.fn();
    });

    it('should mark an unused code as used', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 });

      await expect(repository.markUsed('otp-id')).resolves.toBe(true);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'otp-id', usedAt: IsNull() },
        { usedAt: expect.any(Date) },
      );
    });

    it('should return false when the code was already used', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 0 });

      await expect(repository.markUsed('otp-id')).resolves.toBe(false);
    });
  });
});
