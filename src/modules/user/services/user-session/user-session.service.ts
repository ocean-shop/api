import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { REFRESH_EXPIRE_TIME_KEY } from '../../constants/auth.constants';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import {
  buildRefreshTokenExpiryDate,
  hashRefreshToken,
  toAuthUser,
} from '../../helpers/user-session/user-session.helpers';
import { AuthSession, SessionClient } from '../../models/auth.models';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserSessionService {
  constructor(
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /** Opens a session; its id goes into the refresh token so lookups need no scan. */
  async startSession(user: User, client: SessionClient): Promise<AuthSession> {
    const sessionId = randomUUID();
    const tokens = this.authService.generateTokens(user, sessionId);

    const session = this.userSessionRepository.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      userAgent: client.userAgent || null,
      ipAddress: client.ipAddress || null,
      expiresAt: this.buildExpiryDate(),
    });
    await this.userSessionRepository.save(session);

    return { ...tokens, user: toAuthUser(user) };
  }

  /** Replaces the session's refresh token; the presented one stops working. */
  async rotateSession(
    session: UserSession,
    user: User,
    client: SessionClient,
  ): Promise<AuthSession> {
    const tokens = this.authService.generateTokens(user, session.id);

    const isRotated = await this.userSessionRepository.rotate({
      sessionId: session.id,
      currentHash: session.refreshTokenHash,
      nextHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: this.buildExpiryDate(),
      ...client,
    });

    if (!isRotated) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
    }

    return { ...tokens, user: toAuthUser(user) };
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.userSessionRepository.revoke(sessionId, userId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.userSessionRepository.revokeAllByUserId(userId);
  }

  private buildExpiryDate(): Date {
    const configured = this.configService.get<string>(REFRESH_EXPIRE_TIME_KEY);
    return buildRefreshTokenExpiryDate(
      configured ? parseInt(configured, 10) : undefined,
    );
  }
}
