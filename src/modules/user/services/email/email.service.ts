import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Queue } from 'bullmq';
import {
  EMAIL_QUEUE,
  SEND_OTP_EMAIL_JOB,
} from '../../../../core/queue/constants/queue.constants';
import { isEmailQueueEnabled } from '../../../../core/queue/helpers/queue.helpers';
import {
  DEFAULT_OTP_EXPIRE_MS,
  MS_PER_MINUTE,
} from '../../constants/email.constants';
import { SendOtpEmailJobData } from '../../models/email.models';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    // Optional: the queue provider only exists when EMAIL_QUEUE_ENABLED=true.
    @Optional()
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue<SendOtpEmailJobData> | null = null,
  ) {}

  async sendOtpEmail(email: string, code: string): Promise<void> {
    if (isEmailQueueEnabled() && this.emailQueue) {
      await this.emailQueue.add(SEND_OTP_EMAIL_JOB, { email, code });
      this.logger.log(`Queued OTP email for ${email}`);
      return;
    }

    await this.sendOtpEmailNow(email, code);
  }

  async sendOtpEmailNow(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your verification code',
      template: 'otp-code',
      context: {
        code,
        expiresInMinutes: this.getOtpExpiryMinutes(),
      },
    });
    this.logger.log(`Sent OTP email to ${email}`);
  }

  private getOtpExpiryMinutes(): number {
    const expireMs = process.env.OTP_EXPIRE
      ? parseInt(process.env.OTP_EXPIRE, 10)
      : DEFAULT_OTP_EXPIRE_MS;
    return Math.round(expireMs / MS_PER_MINUTE);
  }
}
