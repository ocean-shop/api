import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
  JWT_REFRESH_SECRET_KEY,
  OTP_ATTEMPTS_LIMIT,
  OTP_BLOCK_WINDOW_MS,
  OTP_CODE_MIN,
  OTP_CODE_RANGE,
  REFRESH_TOKEN_EXPIRES_IN,
  TOKEN_TYPES,
} from '../../constants/auth.constants';
import { DEFAULT_OTP_EXPIRE_MS } from '../../constants/email.constants';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';
import {
  AuthTokens,
  OtpCode,
  RefreshTokenPayload,
  RefreshTokenVerifyOptions,
} from '../../models/auth.models';
import { JwtPayload } from '../../models/auth-request.models';
import { UserRepository } from '../../repositories/user/user.repository';
import { AuthOtpRepository } from '../../repositories/auth-otp/auth-otp.repository';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly authOtpRepository: AuthOtpRepository,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.refreshSecret = configService.getOrThrow<string>(
      JWT_REFRESH_SECRET_KEY,
    );
  }

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

  /**
   * Checks the code and marks it used. The attempt is counted before the
   * check and the code is used conditionally, both in single updates, so
   * concurrent requests can neither exceed the limit nor use one code twice.
   */
  async consumeOtp(code: string, otp: AuthOtp): Promise<void> {
    const attempts = await this.authOtpRepository.reserveAttempt(
      otp.id,
      OTP_ATTEMPTS_LIMIT,
      new Date(Date.now() + OTP_BLOCK_WINDOW_MS),
    );

    if (attempts === null) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_BLOCKED);
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      throw new BadRequestException(
        attempts >= OTP_ATTEMPTS_LIMIT
          ? AUTH_MESSAGES.OTP_BLOCKED
          : AUTH_MESSAGES.OTP_INVALID,
      );
    }

    const isUsed = await this.authOtpRepository.markUsed(otp.id);
    if (!isUsed) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_NOT_FOUND);
    }
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

  generateTokens(user: User, sessionId: string): AuthTokens {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
      mobileNumber: user.mobileNumber,
      type: TOKEN_TYPES.ACCESS,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sid: sessionId,
      type: TOKEN_TYPES.REFRESH,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
    // A unique id makes every rotation produce a new token, even within the same second.
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.refreshSecret,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      jwtid: randomUUID(),
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(
    refreshToken: string,
    options: RefreshTokenVerifyOptions = {},
  ): RefreshTokenPayload {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret,
        ignoreExpiration: options.ignoreExpiration,
      });
    } catch {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
    }

    if (payload.type !== TOKEN_TYPES.REFRESH || !payload.sid) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_INVALID);
    }

    return payload;
  }
}
