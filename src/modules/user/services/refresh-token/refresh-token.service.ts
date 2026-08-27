import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserSession } from '../../entities/user-session.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { AuthService } from '../auth/auth.service';
import {
  buildRefreshTokenExpiryDate,
  findSessionByRefreshToken,
  hashRefreshToken,
} from '../session/user-session.helpers';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Потрібен refresh-токен');
    }

    try {
      const userId = this.extractUserIdFromToken(refreshToken);
      const user = await this.userRepository.findById(userId);
      const currentSession = await this.findValidSession(userId, refreshToken);

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        this.authService.generateTokens(user);

      await this.updateSession(
        currentSession,
        newRefreshToken,
        userAgent,
        ipAddress,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role?.name || null,
        },
      };
    } catch {
      throw new UnauthorizedException('Недійсний refresh-токен');
    }
  }

  private extractUserIdFromToken(refreshToken: string): string {
    const payload: { sub: string } = this.jwtService.verify(refreshToken);
    return String(payload.sub);
  }

  private async findValidSession(
    userId: string,
    refreshToken: string,
  ): Promise<UserSession> {
    const sessions =
      await this.userSessionRepository.findActiveSessionsByUserId(userId);

    const matchingSession = await findSessionByRefreshToken(
      sessions,
      refreshToken,
      {
        skipExpired: true,
      },
    );
    if (matchingSession) {
      return matchingSession;
    }

    throw new UnauthorizedException('Недійсний refresh-токен');
  }

  private async updateSession(
    session: UserSession,
    newRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    session.refreshTokenHash = await hashRefreshToken(newRefreshToken);
    session.expiresAt = buildRefreshTokenExpiryDate();

    if (userAgent) session.userAgent = userAgent;
    if (ipAddress) session.ipAddress = ipAddress;

    await this.userSessionRepository.save(session);
  }
}
