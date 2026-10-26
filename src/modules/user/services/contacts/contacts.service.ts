import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../../../core/mail/mail.service';
import {
  CONTACT_EMAIL_TEMPLATE,
  CONTACT_MESSAGES,
  contactEmailSubject,
} from '../../constants/email.constants';
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
      throw new InternalServerErrorException(CONTACT_MESSAGES.UNAVAILABLE);
    }

    await this.mailService.sendMail({
      to: adminEmail,
      subject: contactEmailSubject(dto.username),
      template: CONTACT_EMAIL_TEMPLATE,
      context: {
        username: dto.username,
        contact: dto.contact,
        message: dto.message,
      },
    });
    this.logger.log(`Sent contact message from ${dto.contact}`);
  }
}
