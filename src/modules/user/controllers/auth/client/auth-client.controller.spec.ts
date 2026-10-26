import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthClientController } from './auth-client.controller';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { RefreshTokenService } from '../../../services/refresh-token/refresh-token.service';
import { LogoutService } from '../../../services/logout/logout.service';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../../dto/verify-client-otp.dto';
import type { Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthClientController', () => {
  let controller: AuthClientController;
  let authClientService: AuthClientService;
  let refreshTokenService: { refreshToken: jest.Mock };
  let logoutService: { logout: jest.Mock };

  const session = {
    accessToken: 'access',
    refreshToken: 'refresh',
    user: {
      id: 'uuid',
      email: 'client@example.com',
      mobileNumber: null,
      role: 'user',
    },
  };

  beforeEach(async () => {
    const authClientServiceMock = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };
    refreshTokenService = { refreshToken: jest.fn() };
    logoutService = { logout: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthClientController],
      providers: [
        { provide: AuthClientService, useValue: authClientServiceMock },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: LogoutService, useValue: logoutService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
    it('should verify OTP, set the client refresh cookie and return result', async () => {
      const dto: VerifyClientOtpDto = {
        login: 'client@example.com',
        code: '1234',
      };
      jest.spyOn(authClientService, 'verifyOtp').mockResolvedValue(session);
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
        'client_refresh_token',
        'refresh',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
      );
      expect(result).toEqual({ accessToken: 'access', user: session.user });
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    it('should refresh only a client session from the client cookie', async () => {
      refreshTokenService.refreshToken.mockResolvedValue(session);
      const request = {
        cookies: { client_refresh_token: 'old-refresh' },
      } as unknown as Request;
      const response = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.refresh(
        request,
        'agent',
        '127.0.0.1',
        response,
      );

      expect(refreshTokenService.refreshToken).toHaveBeenCalledWith(
        'old-refresh',
        ['user'],
        'agent',
        '127.0.0.1',
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'client_refresh_token',
        'refresh',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ accessToken: 'access', user: session.user });
    });

    it('should ignore the admin cookie', async () => {
      refreshTokenService.refreshToken.mockRejectedValue(
        new UnauthorizedException(),
      );
      const request = {
        cookies: { admin_refresh_token: 'admin-refresh' },
      } as unknown as Request;
      const response = { cookie: jest.fn() } as unknown as Response;

      await expect(
        controller.refresh(request, 'agent', '127.0.0.1', response),
      ).rejects.toThrow(UnauthorizedException);
      expect(refreshTokenService.refreshToken).toHaveBeenCalledWith(
        undefined,
        ['user'],
        'agent',
        '127.0.0.1',
      );
      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should end the client session and clear the client cookie', async () => {
      const request = {
        cookies: { client_refresh_token: 'refresh' },
      } as unknown as Request;
      const response = { clearCookie: jest.fn() } as unknown as Response;

      const result = await controller.logout(request, response);

      expect(logoutService.logout).toHaveBeenCalledWith('refresh');
      expect(response.clearCookie).toHaveBeenCalledWith(
        'client_refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'Ви успішно вийшли з системи' });
    });
  });
});
