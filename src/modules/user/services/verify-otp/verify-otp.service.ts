import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class VerifyOtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async verifyOtp(dto: VerifyOtpDto, userAgent?: string, ipAddress?: string) {
    const user = await this.findUser(dto.email, dto.phone);
    await this.processOtp(user, dto.code, dto.email, dto.phone);

    const { accessToken, refreshToken } = this.generateTokens(user);

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

  private async findUser(email?: string, phone?: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: email ? { email } : { mobileNumber: phone },
      relations: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  private generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = {
      sub: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
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
