import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

type TurboSmsResponseItem = {
  message_id?: string | null;
  response_code?: number | string;
  response_status?: string;
};

type TurboSmsResponse = {
  response_code?: number | string;
  response_status?: string;
  response_result?: TurboSmsResponseItem[];
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private static readonly TURBOSMS_DEFAULT_URL =
    'https://api.turbosms.ua/message/send.json';

  async sendOtpSms(phone: string, code: string): Promise<void> {
    const token = process.env.TURBOSMS_API_TOKEN;
    const sender = process.env.TURBOSMS_SENDER;
    const apiUrl =
      process.env.TURBOSMS_API_URL ?? SmsService.TURBOSMS_DEFAULT_URL;

    if (!token || !sender) {
      throw new InternalServerErrorException('Налаштування TurboSMS відсутні');
    }

    const normalizedPhone = this.normalizeUkrainianPhone(phone);
    const payload = {
      recipients: [normalizedPhone],
      sms: {
        sender,
        text: `Ваш код підтвердження: ${code}`,
      },
    };

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Невідома помилка TurboSMS';
      this.logger.error(
        `Не вдалося надіслати OTP SMS на ${normalizedPhone}: ${message}`,
      );
      throw new ServiceUnavailableException('Не вдалося надіслати OTP SMS');
    }

    const responseBody = await this.parseResponseBody(response);
    if (!response.ok || !this.isSuccessResponse(responseBody)) {
      this.logger.error(
        `TurboSMS відхилив OTP SMS для ${normalizedPhone}. Статус: ${response.status}. Тіло: ${JSON.stringify(responseBody)}`,
      );
      throw new ServiceUnavailableException('Не вдалося надіслати OTP SMS');
    }

    this.logger.log(`Надіслано OTP SMS на ${normalizedPhone}`);
  }

  private normalizeUkrainianPhone(phone: string): string {
    const phoneWithoutPlus = phone.startsWith('+') ? phone.slice(1) : phone;
    const normalized = phoneWithoutPlus.startsWith('0')
      ? `38${phoneWithoutPlus}`
      : phoneWithoutPlus;

    if (!/^380\d{9}$/.test(normalized)) {
      throw new BadRequestException('Некоректний український номер телефону');
    }

    return normalized;
  }

  private async parseResponseBody(
    response: Response,
  ): Promise<TurboSmsResponse | null> {
    try {
      return (await response.json()) as TurboSmsResponse;
    } catch {
      return null;
    }
  }

  private isSuccessResponse(response: TurboSmsResponse | null): boolean {
    if (!response) {
      return false;
    }

    if (response.response_code !== undefined) {
      return Number(response.response_code) === 0;
    }

    if (!response.response_result || response.response_result.length === 0) {
      return false;
    }

    return response.response_result.every((item) => {
      if (item.message_id) {
        return true;
      }

      if (item.response_code !== undefined) {
        return Number(item.response_code) === 0;
      }

      if (!item.response_status) {
        return false;
      }

      return /accepted|queued|ok|success/i.test(item.response_status);
    });
  }
}
