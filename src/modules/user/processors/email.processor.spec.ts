import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';

import { EmailProcessor } from './email.processor';
import { EmailService, SendOtpEmailJobData } from '../services/email.service';
import { SEND_OTP_EMAIL_JOB } from '../../queue/constants/queue.constants';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailService: any;

  beforeEach(async () => {
    emailService = {
      sendOtpEmailNow: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send the OTP email for a send-otp-email job', async () => {
    const job = {
      name: SEND_OTP_EMAIL_JOB,
      data: { email: 'test@example.com', code: '2110' },
    } as Job<SendOtpEmailJobData>;

    await processor.process(job);

    expect(emailService.sendOtpEmailNow).toHaveBeenCalledWith(
      'test@example.com',
      '2110',
    );
  });

  it('should ignore unknown job names', async () => {
    const job = {
      name: 'unknown-job',
      data: { email: 'test@example.com', code: '2110' },
    } as Job<SendOtpEmailJobData>;

    await processor.process(job);

    expect(emailService.sendOtpEmailNow).not.toHaveBeenCalled();
  });
});
