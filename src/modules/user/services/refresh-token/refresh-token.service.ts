import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const userId = this.extractUserIdFromToken(refreshToken);
      const user = await this.getUser(userId);
      const currentSession = await this.findValidSession(userId, refreshToken);

      const { newAccessToken, newRefreshToken } = this.generateTokens(user);

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
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractUserIdFromToken(refreshToken: string): string {
    const payload: { sub: string } = this.jwtService.verify(refreshToken);
    return String(payload.sub);
  }

  private async getUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async findValidSession(
    userId: string,
    refreshToken: string,
  ): Promise<UserSession> {
    const sessions = await this.userSessionRepository.find({
      where: { userId, revokedAt: IsNull() },
    });

    for (const session of sessions) {
      if (session.expiresAt < new Date()) {
        continue;
      }
      const isValid = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isValid) {
        return session;
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  private generateTokens(user: User): {
    newAccessToken: string;
    newRefreshToken: string;
  } {
    const newPayload = {
      sub: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
    };
    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: '15m',
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: '7d',
    });

    return { newAccessToken, newRefreshToken };
  }

  private async updateSession(
    session: UserSession,
    newRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    session.refreshTokenHash = await bcrypt.hash(newRefreshToken, salt);

    const refreshExpireTime = process.env.REFRESH_EXPIRE_TIME
      ? parseInt(process.env.REFRESH_EXPIRE_TIME, 10)
      : 7 * 24 * 60 * 60 * 1000;
    session.expiresAt = new Date(Date.now() + refreshExpireTime);

    if (userAgent) session.userAgent = userAgent;
    if (ipAddress) session.ipAddress = ipAddress;

    await this.userSessionRepository.save(session);
  }
}
