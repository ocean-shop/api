import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserLanguage } from '../../entities/enums/user-settings.enum';
import { UserSettings } from '../../entities/user-settings.entity';
import { SettingsRepository } from './settings.repository';

describe('SettingsRepository', () => {
  let repository: SettingsRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = { findOne: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsRepository,
        {
          provide: getRepositoryToken(UserSettings),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<SettingsRepository>(SettingsRepository);
  });

  it('should find settings by user id', async () => {
    const settings = { userId: 'user-1' } as UserSettings;
    typeOrmRepository.findOne.mockResolvedValue(settings);

    await expect(repository.findByUserId('user-1')).resolves.toBe(settings);
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('should save settings', async () => {
    const settings = { userId: 'user-1', language: UserLanguage.EN };
    typeOrmRepository.save.mockResolvedValue(settings);

    await expect(repository.save(settings)).resolves.toBe(settings);
    expect(typeOrmRepository.save).toHaveBeenCalledWith(settings);
  });
});
