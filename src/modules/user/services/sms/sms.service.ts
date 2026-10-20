import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  NORMALIZED_UKRAINIAN_PHONE_REGEX,
  UKRAINIAN_COUNTRY_CODE_PREFIX,
} from '../../constants/phone.constants';
import {
  SMS_MESSAGES,
  TURBOSMS_DEFAULT_URL,
  TURBOSMS_SUCCESS_CODE,
  TURBOSMS_SUCCESS_STATUS_REGEX,
} from '../../constants/sms.constants';
import { TurboSmsResponse } from '../../models/sms.models';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtpSms(phone: string, code: string): Promise<void> {
    const token = process.env.TURBOSMS_API_TOKEN;
    const sender = process.env.TURBOSMS_SENDER;
    const apiUrl = process.env.TURBOSMS_API_URL ?? TURBOSMS_DEFAULT_URL;

    if (!token || !sender) {
      throw new InternalServerErrorException(SMS_MESSAGES.NOT_CONFIGURED);
    }

    const normalizedPhone = this.normalizeUkrainianPhone(phone);
    const payload = {
      recipients: [normalizedPhone],
      sms: {
        sender,
        text: SMS_MESSAGES.otpText(code),
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
        error instanceof Error ? error.message : SMS_MESSAGES.UNKNOWN_ERROR;
      this.logger.error(
        `Не вдалося надіслати OTP SMS на ${normalizedPhone}: ${message}`,
      );
      throw new ServiceUnavailableException(SMS_MESSAGES.SEND_FAILED);
    }

    const responseBody = await this.parseResponseBody(response);
    if (!response.ok || !this.isSuccessResponse(responseBody)) {
      this.logger.error(
        `TurboSMS відхилив OTP SMS для ${normalizedPhone}. Статус: ${response.status}. Тіло: ${JSON.stringify(responseBody)}`,
      );
      throw new ServiceUnavailableException(SMS_MESSAGES.SEND_FAILED);
    }

    this.logger.log(`Надіслано OTP SMS на ${normalizedPhone}`);
  }

  private normalizeUkrainianPhone(phone: string): string {
    const phoneWithoutPlus = phone.startsWith('+') ? phone.slice(1) : phone;
    const normalized = phoneWithoutPlus.startsWith('0')
      ? `${UKRAINIAN_COUNTRY_CODE_PREFIX}${phoneWithoutPlus}`
      : phoneWithoutPlus;

    if (!NORMALIZED_UKRAINIAN_PHONE_REGEX.test(normalized)) {
      throw new BadRequestException(SMS_MESSAGES.INVALID_PHONE);
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
      return Number(response.response_code) === TURBOSMS_SUCCESS_CODE;
    }

    if (!response.response_result || response.response_result.length === 0) {
      return false;
    }

    return response.response_result.every((item) => {
      if (item.message_id) {
        return true;
      }

      if (item.response_code !== undefined) {
        return Number(item.response_code) === TURBOSMS_SUCCESS_CODE;
      }

      if (!item.response_status) {
        return false;
      }

      return TURBOSMS_SUCCESS_STATUS_REGEX.test(item.response_status);
    });
  }
}
