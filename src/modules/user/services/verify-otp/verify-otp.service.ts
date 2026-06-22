import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { AuthService } from '../auth/auth.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { UserSessionRepository } from '../../repositories/user-session/user-session.repository';

@Injectable()
export class VerifyOtpService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly authService: AuthService,
  ) {}

  async verifyOtp(dto: VerifyOtpDto, userAgent?: string, ipAddress?: string) {
    const user = await this.userRepository.findByEmailOrPhone(
      dto.email,
      dto.phone,
    );
    await this.processOtp(user, dto.code, dto.email, dto.phone);
    const { accessToken, refreshToken } = this.authService.generateTokens(user);
    await this.saveUserSession(user.id, refreshToken, userAgent, ipAddress);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role?.name || null,
      },
    };
  }

  private async processOtp(
    user: User,
    code: string,
    email?: string,
    phone?: string,
  ): Promise<void> {
    const latestOtp = await this.authService.findAndValidateLatestOtp(user.id);
    await this.authService.validateOtpCode(code, latestOtp);

    latestOtp.usedAt = new Date();
    await this.authService.saveAuthOtp(latestOtp);
    await this.authService.verifyUserIfRegistered(
      latestOtp,
      user,
      email,
      phone,
    );
  }

  private async saveUserSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    const refreshExpireTime = process.env.REFRESH_EXPIRE_TIME
      ? parseInt(process.env.REFRESH_EXPIRE_TIME, 10)
      : 7 * 24 * 60 * 60 * 1000;
    const session = this.userSessionRepository.create({
      userId,
      refreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + refreshExpireTime),
    });
    await this.userSessionRepository.save(session);
  }
}
