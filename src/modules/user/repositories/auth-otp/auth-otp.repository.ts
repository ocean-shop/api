import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthOtp } from '../../entities/auth-otp.entity';
import { OtpChannel, OtpPurpose } from '../../entities/enums/auth-otp.enum';

@Injectable()
export class AuthOtpRepository {
  constructor(
    @InjectRepository(AuthOtp)
    private readonly repository: Repository<AuthOtp>,
  ) {}

  create(data: {
    userId: string;
    codeHash: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    expiresAt: Date;
  }): AuthOtp {
    return this.repository.create(data);
  }

  async save(otp: AuthOtp): Promise<AuthOtp> {
    return this.repository.save(otp);
  }

  async findActiveOtpRequest(userId: string): Promise<AuthOtp | null> {
    return this.repository
      .createQueryBuilder('otp')
      .where('otp.user_id = :userId', { userId })
      .andWhere('otp.used_at IS NULL')
      .andWhere('otp.expires_at > :now', { now: new Date() })
      .getOne();
  }

  async findLatestOtp(userId: string): Promise<AuthOtp | null> {
    return this.repository
      .createQueryBuilder('otp')
      .where('otp.user_id = :userId', { userId })
      .andWhere('otp.used_at IS NULL')
      .orderBy('otp.created_at', 'DESC')
      .take(1)
      .getOne();
  }
}
