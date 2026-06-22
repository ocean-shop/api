import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserSession } from '../../entities/user-session.entity';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectRepository(UserSession)
    private readonly repository: Repository<UserSession>,
  ) {}

  create(data: {
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): UserSession {
    return this.repository.create(data);
  }

  async save(session: UserSession): Promise<UserSession> {
    return this.repository.save(session);
  }

  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    return this.repository.find({
      where: { userId, revokedAt: IsNull() },
    });
  }
}
