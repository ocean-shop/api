import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RequestOtpService } from '../services/request-otp/request-otp.service';
import { VerifyOtpService } from '../services/verify-otp/verify-otp.service';
import { RefreshTokenService } from '../services/refresh-token/refresh-token.service';
import { LogoutService } from '../services/logout/logout.service';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let requestOtpService: RequestOtpService;
  let verifyOtpService: VerifyOtpService;
  let refreshTokenService: RefreshTokenService;
  let logoutService: LogoutService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };

    const requestOtpServiceMock = {
      requestAdminOtp: jest.fn(),
    };
    const verifyOtpServiceMock = {
      verifyOtp: jest.fn(),
    };
    const refreshTokenServiceMock = {
      refreshToken: jest.fn(),
    };
    const logoutServiceMock = {
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RequestOtpService, useValue: requestOtpServiceMock },
        { provide: VerifyOtpService, useValue: verifyOtpServiceMock },
        { provide: RefreshTokenService, useValue: refreshTokenServiceMock },
        { provide: LogoutService, useValue: logoutServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    requestOtpService = module.get<RequestOtpService>(RequestOtpService);
    verifyOtpService = module.get<VerifyOtpService>(VerifyOtpService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    logoutService = module.get<LogoutService>(LogoutService);

    process.env.REFRESH_EXPIRE_TIME = '604800000'; // 7 days in ms
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should call requestOtpService.requestAdminOtp and return the result', async () => {
      const dto: RequestOtpDto = { email: 'test@example.com' };
      const expectedResult = { message: 'OTP sent successfully' };
      jest
        .mocked(requestOtpService.requestAdminOtp)
        .mockResolvedValue(expectedResult);

      const result = await controller.requestOtp(dto);

      expect(requestOtpService.requestAdminOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyOtp', () => {
    it('should call verifyOtpService.verifyOtp, set cookie, and return result', async () => {
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

      jest.mocked(verifyOtpService.verifyOtp).mockResolvedValue(expectedResult);

      const result = await controller.verifyOtp(
        dto,
        userAgent,
        ipAddress,
        mockResponse,
      );

      expect(verifyOtpService.verifyOtp).toHaveBeenCalledWith(
        dto,
        userAgent,
        ipAddress,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedResult.refreshToken,
        {
          httpOnly: true,
          secure: false, // NODE_ENV is not production
          sameSite: 'strict',
          maxAge: 604800000,
        },
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle production environment and missing REFRESH_EXPIRE_TIME', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.REFRESH_EXPIRE_TIME;

      const dto: VerifyOtpDto = { email: 'test@example.com', code: '1234' };
      const mockResponse = { cookie: jest.fn() } as unknown as Response;
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

      jest.mocked(verifyOtpService.verifyOtp).mockResolvedValue(expectedResult);

      await controller.verifyOtp(dto, 'agent', 'ip', mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedResult.refreshToken,
        {
          httpOnly: true,
          secure: true, // NODE_ENV is production
          sameSite: 'strict',
          maxAge: 0, // REFRESH_EXPIRE_TIME is missing
        },
      );
    });
  });

  describe('refresh', () => {
    it('should call refreshTokenService.refreshToken, set cookie, and return result', async () => {
      const userAgent = 'test-agent';
      const ipAddress = '127.0.0.1';

      const mockRequest = {
        cookies: { refresh_token: 'old-refresh-token' },
      } as unknown as Request;

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'uuid',
          email: 'test@example.com',
          mobileNumber: null,
          role: null,
        },
      };

      jest
        .mocked(refreshTokenService.refreshToken)
        .mockResolvedValue(expectedResult);

      const result = await controller.refresh(
        mockRequest,
        userAgent,
        ipAddress,
        mockResponse,
      );

      expect(refreshTokenService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
        userAgent,
        ipAddress,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedResult.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 604800000,
        },
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call logoutService.logout, clear cookie, and return success message', async () => {
      const mockRequest = {
        cookies: { refresh_token: 'refresh-token-to-logout' },
      } as unknown as Request;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.logout(mockRequest, mockResponse);

      expect(logoutService.logout).toHaveBeenCalledWith(
        'refresh-token-to-logout',
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should clear cookie with secure true in production', async () => {
      process.env.NODE_ENV = 'production';

      const mockRequest = {
        cookies: { refresh_token: 'refresh-token-to-logout' },
      } as unknown as Request;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      await controller.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });
    });
  });
});
