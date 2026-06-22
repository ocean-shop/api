import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';

@Injectable()
export class LogoutService {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
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
    const sessions =
      await this.userSessionRepository.findActiveSessionsByUserId(userId);

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
