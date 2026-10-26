import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, MoreThan } from 'typeorm';
import { UserSessionRepository } from './user-session.repository';
import { UserSession } from '../../entities/user-session.entity';

describe('UserSessionRepository', () => {
  let repository: UserSessionRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionRepository,
        {
          provide: getRepositoryToken(UserSession),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserSessionRepository>(UserSessionRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a UserSession instance with the given id', () => {
      const data = {
        id: 'session-id',
        userId: 'uuid',
        refreshTokenHash: 'hash',
        userAgent: 'agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(),
      };
      const expectedSession = data as UserSession;
      typeOrmRepository.create.mockReturnValue(expectedSession);

      const result = repository.create(data);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expectedSession);
    });
  });

  describe('save', () => {
    it('should save a UserSession instance', async () => {
      const session = { id: 'session-id', userId: 'uuid' } as UserSession;
      typeOrmRepository.save.mockResolvedValue(session);

      const result = await repository.save(session);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(session);
      expect(result).toEqual(session);
    });
  });

  describe('findActiveById', () => {
    it('should find a live, unrevoked session of the user', async () => {
      const session = { id: 'session-id' } as UserSession;
      typeOrmRepository.findOne.mockResolvedValue(session);

      const result = await repository.findActiveById('session-id', 'uuid');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'session-id',
          userId: 'uuid',
          revokedAt: IsNull(),
          expiresAt: MoreThan(expect.any(Date)),
        },
      });
      expect(result).toBe(session);
    });
  });

  describe('rotate', () => {
    const rotation = {
      sessionId: 'session-id',
      currentHash: 'old-hash',
      nextHash: 'new-hash',
      expiresAt: new Date(1000),
    };

    it('should swap the hash only while the presented one is current', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 });

      await expect(
        repository.rotate({
          ...rotation,
          userAgent: 'agent',
          ipAddress: '1.1.1.1',
        }),
      ).resolves.toBe(true);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        {
          id: 'session-id',
          refreshTokenHash: 'old-hash',
          revokedAt: IsNull(),
        },
        {
          refreshTokenHash: 'new-hash',
          expiresAt: rotation.expiresAt,
          userAgent: 'agent',
          ipAddress: '1.1.1.1',
        },
      );
    });

    it('should keep the stored client info when none is given', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 });

      await repository.rotate(rotation);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        expect.any(Object),
        { refreshTokenHash: 'new-hash', expiresAt: rotation.expiresAt },
      );
    });

    it('should return false when another request rotated it first', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 0 });

      await expect(repository.rotate(rotation)).resolves.toBe(false);
    });
  });

  describe('revoke', () => {
    it('should revoke the given session of the user', async () => {
      await repository.revoke('session-id', 'uuid');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'session-id', userId: 'uuid', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe('revokeAllByUserId', () => {
    it('should revoke every open session of the user', async () => {
      await repository.revokeAllByUserId('uuid');

      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { userId: 'uuid', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});
