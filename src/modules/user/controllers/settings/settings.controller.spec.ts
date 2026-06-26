import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from '../../services/settings/settings.service';
import { UserLanguage } from '../../entities/enums/user-settings.enum';
import { UpdateSettingsDto } from '../../dto/update-settings.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

describe('SettingsController', () => {
  let controller: SettingsController;
  let settingsService: SettingsService;

  beforeEach(async () => {
    const settingsServiceMock = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: settingsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SettingsController>(SettingsController);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should call settingsService.getSettings', async () => {
      const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
      const expectedResult = {
        userId,
        language: UserLanguage.EN,
      };

      jest
        .mocked(settingsService.getSettings)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.getSettings(userId);

      expect(settingsService.getSettings).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateSettings', () => {
    it('should call settingsService.updateSettings', async () => {
      const dto: UpdateSettingsDto = {
        userId: '98f21967-fce6-4ceb-af61-304913f593a7',
        language: UserLanguage.UA,
      };
      const expectedResult = {
        userId: dto.userId,
        language: dto.language,
      };

      jest
        .mocked(settingsService.updateSettings)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.updateSettings(dto);

      expect(settingsService.updateSettings).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
