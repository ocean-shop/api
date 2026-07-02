import { Controller, Post, Body, Res, Req, Headers, Ip } from '@nestjs/common';
import type { Response, Request } from 'express';
import { RequestOtpService } from '../../services/request-otp/request-otp.service';
import { VerifyOtpService } from '../../services/verify-otp/verify-otp.service';
import { RefreshTokenService } from '../../services/refresh-token/refresh-token.service';
import { LogoutService } from '../../services/logout/logout.service';
import { RequestOtpDto } from '../../dto/request-otp.dto';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';

@Controller('user/auth')
export class AuthController {
  constructor(
    private readonly requestOtpService: RequestOtpService,
    private readonly verifyOtpService: VerifyOtpService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('admin/request-otp')
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return await this.requestOtpService.requestAdminOtp(requestOtpDto);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.verifyOtpService.verifyOtp(
      verifyOtpDto,
      userAgent,
      ipAddress,
    );

    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'] as string;
    const result = await this.refreshTokenService.refreshToken(
      refreshToken,
      userAgent,
      ipAddress,
    );

    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'] as string;
    await this.logoutService.logout(refreshToken);

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logged out successfully' };
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_EXPIRE_TIME ?? '0', 10),
    });
  }
}
