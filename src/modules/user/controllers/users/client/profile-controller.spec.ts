import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile-controller';
import { ProfileService } from '../../../services/profile/profile.service';
import { UpdateProfileDto } from '../../../dto/update-profile.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { AuthenticatedRequest } from '../../../models/auth-request.models';

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: ProfileService;

  const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
  const request = {
    user: { sub: userId, email: null, role: 'user', mobileNumber: null },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const profileServiceMock = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should call profileService.getProfile', async () => {
      const expectedResult = {
        userId,
        fullName: 'John Doe',
        phoneNumber: '+380501234567',
      };

      jest.mocked(profileService.getProfile).mockResolvedValue(expectedResult);

      const result = await controller.getProfile(userId, request);

      expect(profileService.getProfile).toHaveBeenCalledWith(
        userId,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProfile', () => {
    it('should call profileService.updateProfile', async () => {
      const dto: UpdateProfileDto = {
        fullName: 'John Doe',
        phoneNumber: '+380501234567',
      };
      const expectedResult = { userId, ...dto };

      jest
        .mocked(profileService.updateProfile)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.updateProfile(userId, dto, request);

      expect(profileService.updateProfile).toHaveBeenCalledWith(
        userId,
        dto,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
