import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { AuthOtp } from '../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../entities/enums/auth-otp.enum';
import { UserSession } from '../entities/user-session.entity';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthOtp)
    private readonly authOtpRepository: Repository<AuthOtp>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const email = dto.email;
    const phone = dto.phone;
    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }

    const user = await this.userRepository.findOne({
      where: email ? { email } : { mobileNumber: phone },
    });

    if (user) {
      await this.checkActiveOtpRequest(user.id);

      if (!this.isUserVerified(user, email, phone)) {
        throw new BadRequestException('Email or phone is not verified');
      }
      await this.handleExistingUserOtp(user, email, phone);
    } else {
      await this.handleNewUserOtp(email, phone);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto, userAgent?: string, ipAddress?: string) {
    const email = dto.email;
    const phone = dto.phone;
    const code = dto.code;

    const user = await this.userRepository.findOne({
      where: email ? { email } : { mobileNumber: phone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const latestOtp = await this.findAndValidateLatestOtp(user.id);
    await this.validateOtpCode(code, latestOtp);

    latestOtp.usedAt = new Date();
    await this.authOtpRepository.save(latestOtp);
    await this.verifyUserIfRegistered(latestOtp, user, email, phone);

    const payload = {
      sub: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.saveUserSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
      },
    };
  }

  private async generateOtpCodeAndHash(): Promise<{
    code: string;
    codeHash: string;
  }> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    return { code, codeHash };
  }

  private async saveOtp(
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

  private async handleExistingUserOtp(
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ) {
    const purpose = OtpPurpose.LOGIN;
    await this.createAndSendOtp(user.id, email, phone, purpose);
  }

  private async handleNewUserOtp(
    email: string | undefined,
    phone: string | undefined,
  ) {
    let newUser = this.userRepository.create({
      email: email || null,
      mobileNumber: phone || null,
    });
    newUser = await this.userRepository.save(newUser);
    const purpose = OtpPurpose.REGISTER;
    await this.createAndSendOtp(newUser.id, email, phone, purpose);
  }

  private async createAndSendOtp(
    userId: string,
    email: string | undefined,
    phone: string | undefined,
    purpose: OtpPurpose,
  ) {
    const { code, codeHash } = await this.generateOtpCodeAndHash();
    await this.saveOtp(userId, codeHash, email, purpose);

    if (email) {
      await this.emailService.sendOtpEmail(email, code);
      return;
    }

    // No SMS provider yet: keep logging the code for the phone channel.
    this.logger.log(`Generated OTP code for ${phone}: ${code}`);
  }

  private isUserVerified(
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ): boolean {
    if (email) return user.isEmailVerified;
    if (phone) return user.isMobileVerified;
    return false;
  }

  private async checkActiveOtpRequest(userId: string) {
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

  private async findAndValidateLatestOtp(userId: string): Promise<AuthOtp> {
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

  private async validateOtpCode(code: string, latestOtp: AuthOtp) {
    const isValid = await bcrypt.compare(code, latestOtp.codeHash);
    if (!isValid) {
      latestOtp.attempts += 1;
      await this.authOtpRepository.save(latestOtp);
      throw new BadRequestException('Invalid OTP code');
    }
  }

  private async verifyUserIfRegistered(
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
