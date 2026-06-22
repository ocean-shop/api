import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EMAIL_QUEUE,
  SEND_OTP_EMAIL_JOB,
} from '../../../core/queue/constants/queue.constants';
import { EmailService } from '../services/email/email.service';
import { SendOtpEmailJobData } from '../models/email.models';

// The decorator call carries an implicit transpilation branch that tests
// cannot exercise, so it is excluded from coverage.
/* v8 ignore start -- @preserve */
@Processor(EMAIL_QUEUE)
/* v8 ignore stop -- @preserve */
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendOtpEmailJobData>): Promise<void> {
    if (job.name !== SEND_OTP_EMAIL_JOB) {
      this.logger.warn(`Unknown job "${job.name}" on the email queue`);
      return;
    }

    await this.emailService.sendOtpEmailNow(job.data.email, job.data.code);
  }
}
