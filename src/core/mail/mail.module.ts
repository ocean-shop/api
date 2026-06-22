import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { DEFAULT_SMTP_PORT } from './constants/mail.constants';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const port = parseInt(
          configService.get<string>('SMTP_PORT') ?? `${DEFAULT_SMTP_PORT}`,
          10,
        );

        return {
          transport: {
            host: configService.get<string>('SMTP_HOST'),
            port,
            secure: false,
            auth: {
              user: configService.get<string>('SMTP_USER'),
              pass: configService.get<string>('SMTP_PASSWORD'),
            },
          },
          defaults: {
            from: configService.get<string>('MAIL_FROM'),
          },
          template: {
            dir: join(__dirname, 'assets', 'templates', 'emails'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}
