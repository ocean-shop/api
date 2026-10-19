import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { MailService } from '../../../../core/mail/mail.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let mailService: { sendMail: jest.Mock };
  let configService: { get: jest.Mock };

  const dto = {
    username: 'Іван',
    contact: 'ivan@example.com',
    message: 'Хочу дізнатися про доставку',
  };

  beforeEach(async () => {
    mailService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    configService = { get: jest.fn().mockReturnValue('admin@shop.com') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  it('should send the contact message to ADMIN_EMAIL', async () => {
    await service.sendContactMessage(dto);

    expect(configService.get).toHaveBeenCalledWith('ADMIN_EMAIL');
    expect(mailService.sendMail).toHaveBeenCalledWith({
      to: 'admin@shop.com',
      subject: 'Нове повідомлення від Іван',
      template: 'contact-us',
      context: dto,
    });
  });

  it('should throw when ADMIN_EMAIL is not set', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.sendContactMessage(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mailService.sendMail).not.toHaveBeenCalled();
  });

  it('should propagate mailer errors', async () => {
    mailService.sendMail.mockRejectedValue(new Error('Resend down'));

    await expect(service.sendContactMessage(dto)).rejects.toThrow(
      'Resend down',
    );
  });
});
