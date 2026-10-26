import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { UserSession } from '../../entities/user-session.entity';
import { SessionRotation } from '../../models/auth.models';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectRepository(UserSession)
    private readonly repository: Repository<UserSession>,
  ) {}

  create(data: {
    id: string;
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

  async findActiveById(
    id: string,
    userId: string,
  ): Promise<UserSession | null> {
    return this.repository.findOne({
      where: {
        id,
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /**
   * Swaps the token hash only if it is still the one the caller presented, so
   * two concurrent refreshes with the same token cannot both succeed.
   */
  async rotate(rotation: SessionRotation): Promise<boolean> {
    const result = await this.repository.update(
      {
        id: rotation.sessionId,
        refreshTokenHash: rotation.currentHash,
        revokedAt: IsNull(),
      },
      {
        refreshTokenHash: rotation.nextHash,
        expiresAt: rotation.expiresAt,
        ...(rotation.userAgent && { userAgent: rotation.userAgent }),
        ...(rotation.ipAddress && { ipAddress: rotation.ipAddress }),
      },
    );

    return result.affected === 1;
  }

  async revoke(id: string, userId: string): Promise<void> {
    await this.repository.update(
      { id, userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
