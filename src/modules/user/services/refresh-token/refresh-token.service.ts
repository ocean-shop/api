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
} from '../../helpers/user-session.helpers';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { AuthResponse, RefreshTokenPayload } from '../../models/auth.models';

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
  ): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED);
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
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
    }
  }

  private extractUserIdFromToken(refreshToken: string): string {
    const payload: RefreshTokenPayload = this.jwtService.verify(refreshToken);
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

    throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
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
