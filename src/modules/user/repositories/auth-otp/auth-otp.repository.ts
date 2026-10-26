import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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

  /**
   * Atomically counts one more attempt before the code is checked, so parallel
   * guesses cannot slip past the limit. An expired block starts a new round;
   * the attempt that reaches the limit also sets the block.
   *
   * @returns the attempt number, or `null` when the code is blocked or used.
   */
  async reserveAttempt(
    id: string,
    limit: number,
    blockedUntil: Date,
  ): Promise<number | null> {
    const nextAttempts =
      'CASE WHEN blocked_until <= :now THEN 1 ELSE attempts + 1 END';

    const result = await this.repository
      .createQueryBuilder()
      .update(AuthOtp)
      .set({
        attempts: () => nextAttempts,
        blockedUntil: () =>
          `CASE WHEN ${nextAttempts} >= :limit THEN CAST(:blockedUntil AS timestamptz) ELSE NULL END`,
      })
      .where('id = :id')
      .andWhere('used_at IS NULL')
      .andWhere(
        '((blocked_until IS NULL AND attempts < :limit) OR blocked_until <= :now)',
      )
      .setParameters({ id, limit, blockedUntil, now: new Date() })
      .returning(['attempts'])
      .execute();

    const rows = result.raw as Pick<AuthOtp, 'attempts'>[];
    return rows[0]?.attempts ?? null;
  }

  /** Marks the code used; `false` when a parallel request already used it. */
  async markUsed(id: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    return result.affected === 1;
  }
}
