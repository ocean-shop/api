import {
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new SmsService();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.TURBOSMS_API_TOKEN = 'test-token';
    process.env.TURBOSMS_SENDER = 'TestSender';
    process.env.TURBOSMS_API_URL = 'https://api.turbosms.ua/message/send.json';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TURBOSMS_API_TOKEN;
    delete process.env.TURBOSMS_SENDER;
    delete process.env.TURBOSMS_API_URL;
  });

  it('should send OTP SMS with normalized recipient and Bearer token', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(true, 200, {
        response_result: [{ message_id: 'sms-message-id' }],
      }),
    );

    await service.sendOtpSms('+380991112233', '1234');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.turbosms.ua/message/send.json',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(callBody).toEqual({
      recipients: ['380991112233'],
      sms: {
        sender: 'TestSender',
        text: 'Ваш код підтвердження: 1234',
      },
    });
  });

  it('should accept already normalized Ukrainian phone format', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(true, 200, {
        response_result: [{ message_id: 'sms-message-id' }],
      }),
    );

    await service.sendOtpSms('380991112233', '5678');

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(callBody.recipients).toEqual(['380991112233']);
  });

  it('should normalize local Ukrainian 0XXXXXXXXX format', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(true, 200, {
        response_result: [{ message_id: 'sms-message-id' }],
      }),
    );

    await service.sendOtpSms('0991112233', '7890');

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(callBody.recipients).toEqual(['380991112233']);
  });

  it('should throw ServiceUnavailableException on TurboSMS network failure', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(service.sendOtpSms('+380991112233', '1234')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('should throw if TurboSMS configuration is missing', async () => {
    delete process.env.TURBOSMS_API_TOKEN;

    await expect(service.sendOtpSms('+380991112233', '1234')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});

function mockResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}
