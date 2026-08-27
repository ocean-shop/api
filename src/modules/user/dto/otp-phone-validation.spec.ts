import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from '@jest/globals';
import { RequestOtpDto } from './request-otp.dto';
import { VerifyOtpDto } from './verify-otp.dto';

describe('OTP phone validation DTOs', () => {
  it('accepts +380, 380, and 0 formats for request OTP', async () => {
    const withPlus = plainToInstance(RequestOtpDto, { phone: '+380991112233' });
    const withoutPlus = plainToInstance(RequestOtpDto, {
      phone: '380991112233',
    });
    const localFormat = plainToInstance(RequestOtpDto, { phone: '0991112233' });

    const withPlusErrors = await validate(withPlus);
    const withoutPlusErrors = await validate(withoutPlus);
    const localFormatErrors = await validate(localFormat);

    expect(withPlusErrors).toHaveLength(0);
    expect(withoutPlusErrors).toHaveLength(0);
    expect(localFormatErrors).toHaveLength(0);
  });

  it('rejects non-Ukrainian phone format for request OTP', async () => {
    const dto = plainToInstance(RequestOtpDto, { phone: '991112233' });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });

  it('rejects non-Ukrainian phone format for verify OTP', async () => {
    const dto = plainToInstance(VerifyOtpDto, {
      phone: '1234567890',
      code: '1234',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'phone')).toBe(true);
  });
});
