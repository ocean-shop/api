import { OTP_THROTTLE_LOGIN_FIELDS } from '../constants/auth.constants';
import { UA_PHONE_SUBSCRIBER_DIGITS } from '../constants/phone.constants';

/**
 * Brings every spelling of one login to the same key: emails are compared
 * case-insensitively, and `+380…`, `380…` and `0…` phones by their last digits.
 */
export function normalizeLogin(login: string): string {
  const value = login.trim().toLowerCase();

  if (value.includes('@')) {
    return value;
  }

  return value.replace(/\D/g, '').slice(-UA_PHONE_SUBSCRIBER_DIGITS);
}

/**
 * Throttles OTP requests per login rather than per IP: the storefront calls
 * the API from its own server, so all its shoppers share one IP address.
 */
export function resolveOtpThrottleTracker(
  req: Record<string, unknown>,
): string {
  const body = (req.body ?? {}) as Record<string, unknown>;

  for (const field of OTP_THROTTLE_LOGIN_FIELDS) {
    const value = body[field];
    if (typeof value === 'string' && value.trim()) {
      return `login:${normalizeLogin(value)}`;
    }
  }

  return `ip:${String(req.ip)}`;
}
