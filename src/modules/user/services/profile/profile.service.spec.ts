import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfile } from '../../entities/user-profile.entity';
import { JwtPayload } from '../../models/auth-request.models';
import { ProfileRepository } from '../../repositories/profile/profile.repository';
import { UserRepository } from '../../repositories/user/user.repository';
import { ProfileService } from './profile.service';

const USER_ID = 'user-1';
const otherClient: JwtPayload = {
  sub: 'user-2',
  role: 'user',
  email: null,
  mobileNumber: null,
};

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepository: { findById: jest.Mock };
  let profileRepository: { findByUserId: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    userRepository = { findById: jest.fn().mockResolvedValue({ id: USER_ID }) };
    profileRepository = { findByUserId: jest.fn(), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: UserRepository, useValue: userRepository },
        { provide: ProfileRepository, useValue: profileRepository },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('getProfile', () => {
    it('should return the stored profile', async () => {
      const profile = { userId: USER_ID, fullName: 'Ivan' } as UserProfile;
      profileRepository.findByUserId.mockResolvedValue(profile);

      await expect(service.getProfile(USER_ID)).resolves.toBe(profile);
      expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
    });

    it('should return an empty profile when none is stored', async () => {
      profileRepository.findByUserId.mockResolvedValue(null);

      await expect(service.getProfile(USER_ID)).resolves.toEqual({
        userId: USER_ID,
        fullName: null,
        phoneNumber: null,
        birthday: null,
      });
    });

    it('should propagate a missing user', async () => {
      userRepository.findById.mockRejectedValue(new NotFoundException());

      await expect(service.getProfile(USER_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(profileRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should forbid a client from reading another profile', async () => {
      await expect(service.getProfile(USER_ID, otherClient)).rejects.toThrow(
        ForbiddenException,
      );
      expect(userRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const dto = {
      fullName: 'Ivan Petrenko',
      phoneNumber: '+380991112233',
      birthday: '1990-01-01',
    };

    it('should save the profile and return the stored one', async () => {
      const stored = { userId: USER_ID, ...dto } as unknown as UserProfile;
      profileRepository.findByUserId.mockResolvedValue(stored);

      await expect(service.updateProfile(USER_ID, dto)).resolves.toBe(stored);
      expect(profileRepository.save).toHaveBeenCalledWith({
        userId: USER_ID,
        ...dto,
      });
    });

    it('should forbid a client from updating another profile', async () => {
      await expect(
        service.updateProfile(USER_ID, dto, otherClient),
      ).rejects.toThrow(ForbiddenException);
      expect(profileRepository.save).not.toHaveBeenCalled();
    });
  });
});
