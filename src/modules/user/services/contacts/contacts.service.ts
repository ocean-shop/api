import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../../../core/mail/mail.service';
import { CreateContactDto } from '../../dto/create-contact.dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async sendContactMessage(dto: CreateContactDto): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.error('ADMIN_EMAIL is not set; cannot send contact message');
      throw new InternalServerErrorException(
        'Contact form is temporarily unavailable',
      );
    }

    await this.mailService.sendMail({
      to: adminEmail,
      subject: `Нове повідомлення від ${dto.username}`,
      template: 'contact-us',
      context: {
        username: dto.username,
        contact: dto.contact,
        message: dto.message,
      },
    });
    this.logger.log(`Sent contact message from ${dto.contact}`);
  }
}
