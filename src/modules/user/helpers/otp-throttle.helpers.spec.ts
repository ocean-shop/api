import {
  normalizeLogin,
  resolveOtpThrottleTracker,
} from './otp-throttle.helpers';

describe('otp-throttle.helpers', () => {
  describe('normalizeLogin', () => {
    it('should lowercase and trim an email', () => {
      expect(normalizeLogin('  Client@Example.COM ')).toBe(
        'client@example.com',
      );
    });

    it.each(['+380991112233', '380991112233', '0991112233', '099 111 22 33'])(
      'should reduce phone %s to its subscriber digits',
      (phone) => {
        expect(normalizeLogin(phone)).toBe('991112233');
      },
    );
  });

  describe('resolveOtpThrottleTracker', () => {
    it('should track the client login field', () => {
      expect(
        resolveOtpThrottleTracker({
          body: { login: '+380991112233' },
          ip: '1.1.1.1',
        }),
      ).toBe('login:991112233');
    });

    it('should track the admin email field', () => {
      expect(
        resolveOtpThrottleTracker({ body: { email: 'A@b.c' }, ip: '1.1.1.1' }),
      ).toBe('login:a@b.c');
    });

    it('should track the admin phone field', () => {
      expect(
        resolveOtpThrottleTracker({
          body: { phone: '0991112233' },
          ip: '1.1.1.1',
        }),
      ).toBe('login:991112233');
    });

    it.each([
      ['no body', { ip: '1.1.1.1' }],
      ['an empty login', { body: { login: '  ' }, ip: '1.1.1.1' }],
      ['a non-string login', { body: { login: 42 }, ip: '1.1.1.1' }],
    ])('should fall back to the IP for %s', (_label, req) => {
      expect(resolveOtpThrottleTracker(req)).toBe('ip:1.1.1.1');
    });
  });
});
