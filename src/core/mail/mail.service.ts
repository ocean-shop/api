import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import { Resend } from 'resend';

export interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly templateCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set; outbound emails will fail to send',
      );
    }
    this.resend = new Resend(apiKey);
    this.from = this.configService.get<string>('MAIL_FROM') ?? '';
  }

  async sendMail({
    to,
    subject,
    template,
    context,
  }: SendMailOptions): Promise<void> {
    const html = this.renderTemplate(template, context);

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  }

  private renderTemplate(
    template: string,
    context: Record<string, unknown>,
  ): string {
    let compiled = this.templateCache.get(template);

    if (!compiled) {
      const templatePath = join(
        __dirname,
        'assets',
        'templates',
        'emails',
        `${template}.hbs`,
      );
      const source = readFileSync(templatePath, 'utf8');
      compiled = Handlebars.compile(source, { strict: true });
      this.templateCache.set(template, compiled);
    }

    return compiled(context);
  }
}
