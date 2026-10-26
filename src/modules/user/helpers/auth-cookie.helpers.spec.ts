import type { Response } from 'express';
import { DEFAULT_REFRESH_EXPIRE_MS } from '../constants/auth.constants';
import {
  buildRefreshTokenClearCookieOptions,
  buildRefreshTokenCookieOptions,
  sendAuthSession,
} from './auth-cookie.helpers';

describe('auth-cookie.helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should build secure cookie options in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.REFRESH_EXPIRE_TIME = '604800000';

    expect(buildRefreshTokenCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 604800000,
    });
  });

  it('should build insecure cookie options outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.REFRESH_EXPIRE_TIME = '1000';

    expect(buildRefreshTokenCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 1000,
    });
  });

  it('should keep the cookie for the default lifetime when none is configured', () => {
    delete process.env.REFRESH_EXPIRE_TIME;

    expect(buildRefreshTokenCookieOptions().maxAge).toBe(
      DEFAULT_REFRESH_EXPIRE_MS,
    );
  });

  it('should build clear options without a max age', () => {
    process.env.NODE_ENV = 'production';

    expect(buildRefreshTokenClearCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  });

  describe('sendAuthSession', () => {
    it('should put the refresh token in a cookie and leave it out of the body', () => {
      const response = { cookie: jest.fn() } as unknown as Response;
      const user = {
        id: 'uuid',
        email: null,
        mobileNumber: null,
        role: 'user',
      };

      const result = sendAuthSession(
        response,
        { accessToken: 'access', refreshToken: 'refresh', user },
        'client_refresh_token',
      );

      expect(response.cookie).toHaveBeenCalledWith(
        'client_refresh_token',
        'refresh',
        buildRefreshTokenCookieOptions(),
      );
      expect(result).toEqual({ accessToken: 'access', user });
      expect(result).not.toHaveProperty('refreshToken');
    });
  });
});
