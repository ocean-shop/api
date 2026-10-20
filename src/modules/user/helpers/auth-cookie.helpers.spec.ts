import {
  buildRefreshTokenClearCookieOptions,
  buildRefreshTokenCookieOptions,
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
    delete process.env.REFRESH_EXPIRE_TIME;

    expect(buildRefreshTokenCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 0,
    });
  });

  it('should build clear options without a max age', () => {
    process.env.NODE_ENV = 'production';

    expect(buildRefreshTokenClearCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  });
});
