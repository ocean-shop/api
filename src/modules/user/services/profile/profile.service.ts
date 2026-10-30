import { Injectable } from '@nestjs/common';
import { assertCanAccessUser } from '../../helpers/access/access.helpers';
import { UserProfile } from '../../entities/user-profile.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { ProfileRepository } from '../../repositories/profile/profile.repository';
import { UpdateProfileDto } from '../../dto/update-profile.dto';
import { JwtPayload } from '../../models/auth-request.models';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async getProfile(
    userId: string,
    requester?: JwtPayload,
  ): Promise<Partial<UserProfile>> {
    assertCanAccessUser(userId, requester);
    await this.userRepository.findById(userId);

    const profile = await this.profileRepository.findByUserId(userId);
    if (profile) {
      return profile;
    }

    return { userId, fullName: null, phoneNumber: null, birthday: null };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    requester?: JwtPayload,
  ): Promise<UserProfile> {
    assertCanAccessUser(userId, requester);
    await this.userRepository.findById(userId);

    await this.profileRepository.save({
      userId,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      birthday: dto.birthday,
    });

    return (await this.profileRepository.findByUserId(userId)) as UserProfile;
  }
}
