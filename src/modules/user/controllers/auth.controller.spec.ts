import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const authServiceMock = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    process.env.REFRESH_EXPIRE_TIME = '604800000'; // 7 days in ms
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should call authService.requestOtp and return the result', async () => {
      const dto: RequestOtpDto = { email: 'test@example.com' };
      const expectedResult = { message: 'OTP sent successfully' };
      jest.mocked(authService.requestOtp).mockResolvedValue(expectedResult);

      const result = await controller.requestOtp(dto);

      expect(authService.requestOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp, set cookie, and return result', async () => {
      const dto: VerifyOtpDto = { email: 'test@example.com', code: '1234' };
      const userAgent = 'test-agent';
      const ipAddress = '127.0.0.1';

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'uuid',
          email: 'test@example.com',
          mobileNumber: null,
          role: null,
        },
      };

      jest.mocked(authService.verifyOtp).mockResolvedValue(expectedResult);

      const result = await controller.verifyOtp(
        dto,
        userAgent,
        ipAddress,
        mockResponse,
      );

      expect(authService.verifyOtp).toHaveBeenCalledWith(
        dto,
        userAgent,
        ipAddress,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedResult.refreshToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 604800000,
        },
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
