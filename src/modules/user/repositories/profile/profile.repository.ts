import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../../entities/user-profile.entity';

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectRepository(UserProfile)
    private readonly repository: Repository<UserProfile>,
  ) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async save(profile: Partial<UserProfile>): Promise<UserProfile> {
    return this.repository.save(profile);
  }
}
