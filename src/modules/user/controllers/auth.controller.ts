import { Controller, Post, Body, Res, Headers, Ip } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

/* v8 ignore start */
@Controller('user/auth')
/* v8 ignore stop */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return await this.authService.requestOtp(requestOtpDto);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyOtp(
      verifyOtpDto,
      userAgent,
      ipAddress,
    );

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_EXPIRE_TIME ?? '0', 10),
    });

    return result;
  }
}
