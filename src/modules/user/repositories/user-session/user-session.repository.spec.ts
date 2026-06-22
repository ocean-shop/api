import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { UserSessionRepository } from './user-session.repository';
import { UserSession } from '../../entities/user-session.entity';

describe('UserSessionRepository', () => {
  let repository: UserSessionRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
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
    it('should create a UserSession instance', () => {
      const data = {
        userId: 'uuid',
        refreshTokenHash: 'hash',
        userAgent: 'agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(),
      };
      const expectedSession = { id: 'session-id', ...data } as UserSession;
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

  describe('findActiveSessionsByUserId', () => {
    it('should find active sessions by user id', async () => {
      const userId = 'uuid';
      const expectedSessions = [
        { id: 'session-1' },
        { id: 'session-2' },
      ] as UserSession[];
      typeOrmRepository.find.mockResolvedValue(expectedSessions);

      const result = await repository.findActiveSessionsByUserId(userId);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId, revokedAt: IsNull() },
      });
      expect(result).toEqual(expectedSessions);
    });
  });
});
