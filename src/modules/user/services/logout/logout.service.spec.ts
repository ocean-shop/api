import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LogoutService } from './logout.service';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../user-session/user-session.service';

describe('LogoutService', () => {
  let service: LogoutService;
  let authService: any;
  let userSessionService: any;

  beforeEach(async () => {
    authService = {
      verifyRefreshToken: jest
        .fn()
        .mockReturnValue({ sub: 'uuid', sid: 'session-id', type: 'refresh' }),
    };
    userSessionService = { revokeSession: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        { provide: AuthService, useValue: authService },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    }).compile();

    service = module.get<LogoutService>(LogoutService);
  });

  it('should do nothing without a token', async () => {
    await service.logout('');

    expect(authService.verifyRefreshToken).not.toHaveBeenCalled();
    expect(userSessionService.revokeSession).not.toHaveBeenCalled();
  });

  it('should revoke the session the token was issued for, even if expired', async () => {
    await service.logout('refresh-token');

    expect(authService.verifyRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
      { ignoreExpiration: true },
    );
    expect(userSessionService.revokeSession).toHaveBeenCalledWith(
      'session-id',
      'uuid',
    );
  });

  it('should swallow an invalid token', async () => {
    authService.verifyRefreshToken.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(service.logout('garbage')).resolves.toBeUndefined();
    expect(userSessionService.revokeSession).not.toHaveBeenCalled();
  });

  it('should swallow a storage error', async () => {
    userSessionService.revokeSession.mockRejectedValue(new Error('db down'));

    await expect(service.logout('refresh-token')).resolves.toBeUndefined();
  });
});
