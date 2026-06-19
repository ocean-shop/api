import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthOtp)
    private readonly authOtpRepository: Repository<AuthOtp>,
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
    const activeOtp = await this.authOtpRepository
      .createQueryBuilder('otp')
      .where('otp.user_id = :userId', { userId })
      .andWhere('otp.used_at IS NULL')
      .andWhere('otp.expires_at > :now', { now: new Date() })
      .getOne();

    if (activeOtp) {
      throw new BadRequestException(
        'You have already sent a request. Please wait until it expires.',
      );
    }
  }

  async findAndValidateLatestOtp(userId: string): Promise<AuthOtp> {
    const otps = await this.authOtpRepository
      .createQueryBuilder('otp')
      .where('otp.user_id = :userId', { userId })
      .andWhere('otp.used_at IS NULL')
      .orderBy('otp.created_at', 'DESC')
      .take(1)
      .getMany();

    const latestOtp = otps[0];

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
}
