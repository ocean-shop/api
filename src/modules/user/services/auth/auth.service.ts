import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { UserRepository } from '../../repositories/user/user.repository';
import { AuthOtpRepository } from '../../repositories/auth-otp/auth-otp.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly authOtpRepository: AuthOtpRepository,
    private readonly jwtService: JwtService,
  ) {}

  async generateOtpCodeAndHash(): Promise<{
    code: string;
    codeHash: string;
  }> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    return { code, codeHash };
  }

  async saveOtp(
    userId: string,
    codeHash: string,
    email: string | undefined,
    purpose: OtpPurpose,
  ) {
    const expireTime = process.env.OTP_EXPIRE
      ? parseInt(process.env.OTP_EXPIRE, 10)
      : 5 * 60 * 1000;
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

  async checkActiveOtpRequest(userId: string) {
    const activeOtp = await this.authOtpRepository.findActiveOtpRequest(userId);

    if (activeOtp) {
      throw new BadRequestException(
        'You have already sent a request. Please wait until it expires.',
      );
    }
  }

  async findAndValidateLatestOtp(userId: string): Promise<AuthOtp> {
    const latestOtp = await this.authOtpRepository.findLatestOtp(userId);

    if (!latestOtp) {
      throw new BadRequestException('No active OTP found');
    }

    if (latestOtp.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    return latestOtp;
  }

  async validateOtpCode(code: string, latestOtp: AuthOtp) {
    const isValid = await bcrypt.compare(code, latestOtp.codeHash);
    if (!isValid) {
      latestOtp.attempts += 1;
      await this.authOtpRepository.save(latestOtp);
      throw new BadRequestException('Invalid OTP code');
    }
  }

  async verifyUserIfRegistered(
    latestOtp: AuthOtp,
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ) {
    if (latestOtp.purpose === OtpPurpose.REGISTER) {
      if (email) user.isEmailVerified = true;
      if (phone) user.isMobileVerified = true;
      await this.userRepository.save(user);
    }
  }

  async saveAuthOtp(otp: AuthOtp) {
    await this.authOtpRepository.save(otp);
  }

  generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
      mobileNumber: user.mobileNumber,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }
}
