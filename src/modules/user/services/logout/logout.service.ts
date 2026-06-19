import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserSession } from '../../entities/user-session.entity';

@Injectable()
export class LogoutService {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const userId = this.extractUserIdFromToken(refreshToken);
      await this.revokeMatchingSession(userId, refreshToken);
    } catch {
      // Ignore errors during logout
    }
  }

  private extractUserIdFromToken(refreshToken: string): string {
    const payload: { sub: string } = this.jwtService.verify(refreshToken, {
      ignoreExpiration: true,
    });
    return String(payload.sub);
  }

  private async revokeMatchingSession(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const sessions = await this.userSessionRepository.find({
      where: { userId, revokedAt: IsNull() },
    });

    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isValid) {
        session.revokedAt = new Date();
        await this.userSessionRepository.save(session);
        break;
      }
    }
  }
}
