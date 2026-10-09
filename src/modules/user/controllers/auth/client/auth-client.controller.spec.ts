import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientController } from './auth-client.controller';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../../dto/verify-client-otp.dto';
import type { Response } from 'express';

describe('AuthClientController', () => {
  let controller: AuthClientController;
  let authClientService: AuthClientService;

  beforeEach(async () => {
    const authClientServiceMock = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthClientController],
      providers: [
        { provide: AuthClientService, useValue: authClientServiceMock },
      ],
    }).compile();

    controller = module.get<AuthClientController>(AuthClientController);
    authClientService = module.get<AuthClientService>(AuthClientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should call authClientService.requestOtp with the correct dto', async () => {
      const dto: RequestClientOtpDto = { login: 'client@example.com' };
      const expectedResult = { message: 'OTP-код успішно надіслано' };
      jest
        .spyOn(authClientService, 'requestOtp')
        .mockResolvedValue(expectedResult);

      const result = await controller.requestOtp(dto);

      expect(authClientService.requestOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP, set refresh cookie and return result', async () => {
      const dto: VerifyClientOtpDto = {
        login: 'client@example.com',
        code: '1234',
      };
      const expectedResult = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: 'uuid',
          email: 'client@example.com',
          mobileNumber: null,
          role: 'user',
        },
      };
      jest
        .spyOn(authClientService, 'verifyOtp')
        .mockResolvedValue(expectedResult);
      const response = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.verifyOtp(
        dto,
        'agent',
        '127.0.0.1',
        response,
      );

      expect(authClientService.verifyOtp).toHaveBeenCalledWith(
        dto,
        'agent',
        '127.0.0.1',
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
