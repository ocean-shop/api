import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
  OTP_ATTEMPTS_LIMIT,
  OTP_BLOCK_WINDOW_MS,
  OTP_CODE_MIN,
  OTP_CODE_RANGE,
  REFRESH_TOKEN_EXPIRES_IN,
} from '../../constants/auth.constants';
import { DEFAULT_OTP_EXPIRE_MS } from '../../constants/email.constants';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { AuthTokens, OtpCode } from '../../models/auth.models';
import { UserRepository } from '../../repositories/user/user.repository';
import { AuthOtpRepository } from '../../repositories/auth-otp/auth-otp.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authOtpRepository: AuthOtpRepository,
    private readonly jwtService: JwtService,
  ) {}

  async generateOtpCodeAndHash(): Promise<OtpCode> {
    const code = Math.floor(
      OTP_CODE_MIN + Math.random() * OTP_CODE_RANGE,
    ).toString();
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const codeHash = await bcrypt.hash(code, salt);
    return { code, codeHash };
  }

  async saveOtp(
    userId: string,
    codeHash: string,
    email: string | undefined,
    purpose: OtpPurpose,
  ): Promise<void> {
    const expireTime = process.env.OTP_EXPIRE
      ? parseInt(process.env.OTP_EXPIRE, 10)
      : DEFAULT_OTP_EXPIRE_MS;
    const otp = this.authOtpRepository.create({
      userId,
      codeHash,
      channel: email ? OtpChannel.EMAIL : OtpChannel.SMS,
      purpose,
      expiresAt: new Date(Date.now() + expireTime),
    });
    await this.authOtpRepository.save(otp);
  }

  isUserVerified(
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ): boolean {
    if (email) return user.isEmailVerified;
    if (phone) return user.isMobileVerified;
    return false;
  }

  async checkActiveOtpRequest(userId: string): Promise<void> {
    const activeOtp = await this.authOtpRepository.findActiveOtpRequest(userId);

    if (activeOtp) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_REQUEST_PENDING);
    }
  }

  async findAndValidateLatestOtp(userId: string): Promise<AuthOtp> {
    const latestOtp = await this.authOtpRepository.findLatestOtp(userId);

    if (!latestOtp) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_NOT_FOUND);
    }

    if (latestOtp.expiresAt < new Date()) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_EXPIRED);
    }

    return latestOtp;
  }

  async validateOtpCode(code: string, latestOtp: AuthOtp): Promise<void> {
    await this.resetOtpAttemptsIfBlockExpired(latestOtp);

    if (latestOtp.blockedUntil && latestOtp.blockedUntil > new Date()) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_BLOCKED);
    }

    const isValid = await bcrypt.compare(code, latestOtp.codeHash);
    if (!isValid) {
      latestOtp.attempts += 1;

      if (latestOtp.attempts >= OTP_ATTEMPTS_LIMIT) {
        latestOtp.blockedUntil = new Date(Date.now() + OTP_BLOCK_WINDOW_MS);
        await this.authOtpRepository.save(latestOtp);
        throw new BadRequestException(AUTH_MESSAGES.OTP_BLOCKED);
      }

      await this.authOtpRepository.save(latestOtp);
      throw new BadRequestException(AUTH_MESSAGES.OTP_INVALID);
    }
  }

  private async resetOtpAttemptsIfBlockExpired(
    latestOtp: AuthOtp,
  ): Promise<void> {
    if (!latestOtp.blockedUntil) {
      return;
    }

    if (latestOtp.blockedUntil > new Date()) {
      return;
    }

    latestOtp.attempts = 0;
    latestOtp.blockedUntil = null;
    await this.authOtpRepository.save(latestOtp);
  }

  async verifyUserIfRegistered(
    latestOtp: AuthOtp,
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ): Promise<void> {
    if (latestOtp.purpose === OtpPurpose.REGISTER) {
      if (email) user.isEmailVerified = true;
      if (phone) user.isMobileVerified = true;
      await this.userRepository.save(user);
    }
  }

  async saveAuthOtp(otp: AuthOtp): Promise<void> {
    await this.authOtpRepository.save(otp);
  }

  generateTokens(user: User): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
      mobileNumber: user.mobileNumber,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }
}
