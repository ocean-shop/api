import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { SettingsRepository } from '../../repositories/settings/settings.repository';
import { UserLanguage } from '../../entities/enums/user-settings.enum';

describe('SettingsService', () => {
  let service: SettingsService;
  let userRepository: UserRepository;
  let settingsRepository: SettingsRepository;

  beforeEach(async () => {
    const userRepositoryMock = {
      findById: jest.fn(),
    };
    const settingsRepositoryMock = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: UserRepository, useValue: userRepositoryMock },
        { provide: SettingsRepository, useValue: settingsRepositoryMock },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    userRepository = module.get<UserRepository>(UserRepository);
    settingsRepository = module.get<SettingsRepository>(SettingsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return existing settings when found', async () => {
      const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
      const existingSettings = { userId, language: UserLanguage.RU };
      jest
        .mocked(userRepository.findById)
        .mockResolvedValue({ id: userId } as any);
      jest
        .mocked(settingsRepository.findByUserId)
        .mockResolvedValue(existingSettings as any);

      const result = await service.getSettings(userId);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(settingsRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(settingsRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingSettings);
    });

    it('should create default settings when not found', async () => {
      const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
      const createdSettings = { userId, language: UserLanguage.EN };
      jest
        .mocked(userRepository.findById)
        .mockResolvedValue({ id: userId } as any);
      jest.mocked(settingsRepository.findByUserId).mockResolvedValue(null);
      jest
        .mocked(settingsRepository.save)
        .mockResolvedValue(createdSettings as any);

      const result = await service.getSettings(userId);

      expect(settingsRepository.save).toHaveBeenCalledWith({
        userId,
        language: UserLanguage.EN,
      });
      expect(result).toEqual(createdSettings);
    });
  });

  describe('updateSettings', () => {
    it('should update settings for a user', async () => {
      const dto = {
        userId: '98f21967-fce6-4ceb-af61-304913f593a7',
        language: UserLanguage.UA,
      };
      const updatedSettings = { ...dto };
      jest
        .mocked(userRepository.findById)
        .mockResolvedValue({ id: dto.userId } as any);
      jest
        .mocked(settingsRepository.save)
        .mockResolvedValue(updatedSettings as any);

      const result = await service.updateSettings(dto);

      expect(userRepository.findById).toHaveBeenCalledWith(dto.userId);
      expect(settingsRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(updatedSettings);
    });
  });
});
