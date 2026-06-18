import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';

import { EmailService } from './email.service';
import {
  EMAIL_QUEUE,
  SEND_OTP_EMAIL_JOB,
} from '../../../core/queue/constants/queue.constants';

describe('EmailService', () => {
  let mailerService: any;
  let emailQueue: any;

  const createService = async (withQueue: boolean): Promise<EmailService> => {
    const providers: any[] = [
      EmailService,
      { provide: MailerService, useValue: mailerService },
    ];

    if (withQueue) {
      providers.push({
        provide: getQueueToken(EMAIL_QUEUE),
        useValue: emailQueue,
      });
    }

    const module: TestingModule = await Test.createTestingModule({
      providers,
    }).compile();

    return module.get<EmailService>(EmailService);
  };

  beforeEach(() => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };
    emailQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    delete process.env.EMAIL_QUEUE_ENABLED;
    delete process.env.OTP_EXPIRE;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.EMAIL_QUEUE_ENABLED;
    delete process.env.OTP_EXPIRE;
  });

  describe('sendOtpEmail', () => {
    it('should send the email directly when the queue is disabled', async () => {
      const service = await createService(true);

      await service.sendOtpEmail('test@example.com', '2110');

      expect(emailQueue.add).not.toHaveBeenCalled();
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Your verification code',
        template: 'otp-code',
        context: { code: '2110', expiresInMinutes: 5 },
      });
    });

    it('should enqueue the email when the queue is enabled', async () => {
      process.env.EMAIL_QUEUE_ENABLED = 'true';
      const service = await createService(true);

      await service.sendOtpEmail('test@example.com', '2110');

      expect(emailQueue.add).toHaveBeenCalledWith(SEND_OTP_EMAIL_JOB, {
        email: 'test@example.com',
        code: '2110',
      });
      expect(mailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should fall back to direct send when enabled but no queue is registered', async () => {
      process.env.EMAIL_QUEUE_ENABLED = 'true';
      const service = await createService(false);

      await service.sendOtpEmail('test@example.com', '2110');

      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should propagate mailer errors', async () => {
      mailerService.sendMail.mockRejectedValue(new Error('SMTP down'));
      const service = await createService(false);

      await expect(
        service.sendOtpEmail('test@example.com', '2110'),
      ).rejects.toThrow('SMTP down');
    });
  });

  describe('sendOtpEmailNow', () => {
    it('should compute expiry minutes from OTP_EXPIRE', async () => {
      process.env.OTP_EXPIRE = '120000';
      const service = await createService(false);

      await service.sendOtpEmailNow('test@example.com', '2110');

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { code: '2110', expiresInMinutes: 2 },
        }),
      );
    });
  });
});
