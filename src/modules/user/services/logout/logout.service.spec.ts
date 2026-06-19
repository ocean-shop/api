import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LogoutService } from './logout.service';
import { UserSession } from '../../entities/user-session.entity';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('LogoutService', () => {
  let service: LogoutService;
  let userSessionRepository: any;
  let jwtService: any;

  beforeEach(async () => {
    userSessionRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      verify: jest.fn().mockReturnValue({ sub: 'uuid' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        {
          provide: getRepositoryToken(UserSession),
          useValue: userSessionRepository,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<LogoutService>(LogoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logout', () => {
    it('should return early if no token', async () => {
      await service.logout('');
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should successfully revoke session', async () => {
      const session = {
        refreshTokenHash: 'hash',
        revokedAt: null,
      };
      userSessionRepository.find.mockResolvedValue([session]);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.logout('token');

      expect(session.revokedAt).toBeDefined();
      expect(userSessionRepository.save).toHaveBeenCalledWith(session);
    });

    it('should ignore errors during logout', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.logout('invalid-token')).resolves.not.toThrow();
      expect(userSessionRepository.find).not.toHaveBeenCalled();
    });
  });
});
