import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProfile } from '../../entities/user-profile.entity';
import { ProfileRepository } from './profile.repository';

describe('ProfileRepository', () => {
  let repository: ProfileRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = { findOne: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileRepository,
        {
          provide: getRepositoryToken(UserProfile),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ProfileRepository>(ProfileRepository);
  });

  it('should find a profile by user id', async () => {
    const profile = { userId: 'user-1' } as UserProfile;
    typeOrmRepository.findOne.mockResolvedValue(profile);

    await expect(repository.findByUserId('user-1')).resolves.toBe(profile);
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('should save a profile', async () => {
    const profile = { userId: 'user-1', fullName: 'Ivan' };
    typeOrmRepository.save.mockResolvedValue(profile);

    await expect(repository.save(profile)).resolves.toBe(profile);
    expect(typeOrmRepository.save).toHaveBeenCalledWith(profile);
  });
});
