import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { findSessionByRefreshToken } from '../session/user-session.helpers';

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

    const matchingSession = await findSessionByRefreshToken(
      sessions,
      refreshToken,
    );
    if (matchingSession) {
      matchingSession.revokedAt = new Date();
      await this.userSessionRepository.save(matchingSession);
    }
  }
}
