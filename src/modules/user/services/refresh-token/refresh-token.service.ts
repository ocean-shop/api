import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserSession } from '../../entities/user-session.entity';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../user-session/user-session.service';
import { isRefreshTokenMatch } from '../../helpers/user-session.helpers';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { AuthSession, SessionClient } from '../../models/auth.models';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
    private readonly userSessionService: UserSessionService,
  ) {}

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED);
    }

    const { sub, sid } = this.authService.verifyRefreshToken(refreshToken);
    const session = await this.findValidSession(sid, sub, refreshToken);
    const user = await this.findActiveUser(session);
    const client: SessionClient = { userAgent, ipAddress };

    return this.userSessionService.rotateSession(session, user, client);
  }

  /** The session must be live and still hold this exact token, not a rotated-out one. */
  private async findValidSession(
    sessionId: string,
    userId: string,
    refreshToken: string,
  ): Promise<UserSession> {
    const session = await this.userSessionRepository.findActiveById(
      sessionId,
      userId,
    );

    if (
      !session ||
      !isRefreshTokenMatch(refreshToken, session.refreshTokenHash)
    ) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
    }

    return session;
  }

  /** A blocked or deleted user loses the session instead of getting new tokens. */
  private async findActiveUser(session: UserSession): Promise<User> {
    const user = await this.findUser(session.userId);

    if (!user?.isActive) {
      await this.userSessionService.revokeSession(session.id, session.userId);
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
    }

    return user;
  }

  private async findUser(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch {
      return null;
    }
  }
}
