import { Controller, Post, Body, Res, Req, Headers, Ip } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { RequestOtpService } from '../../../services/request-otp/request-otp.service';
import { VerifyOtpService } from '../../../services/verify-otp/verify-otp.service';
import { RefreshTokenService } from '../../../services/refresh-token/refresh-token.service';
import { LogoutService } from '../../../services/logout/logout.service';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../../constants/auth-messages.constants';
import { REFRESH_TOKEN_COOKIE } from '../../../constants/auth.constants';
import {
  buildRefreshTokenClearCookieOptions,
  buildRefreshTokenCookieOptions,
} from '../../../helpers/auth-cookie.helpers';
import { AuthResponse } from '../../../models/auth.models';
import { RequestOtpDto } from '../../../dto/request-otp.dto';
import { VerifyOtpDto } from '../../../dto/verify-otp.dto';

@Controller('user/auth')
@ApiTags('User Auth')
export class AuthController {
  constructor(
    private readonly requestOtpService: RequestOtpService,
    private readonly verifyOtpService: VerifyOtpService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('admin/request-otp')
  @ApiOperation({ summary: 'Request admin OTP code' })
  @ApiBody({ type: RequestOtpDto })
  async requestOtp(
    @Body() requestOtpDto: RequestOtpDto,
  ): Promise<MessageResponse> {
    return await this.requestOtpService.requestAdminOtp(requestOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and issue tokens' })
  @ApiBody({ type: VerifyOtpDto })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.verifyOtpService.verifyOtp(
      verifyOtpDto,
      userAgent,
      ipAddress,
    );

    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token by refresh cookie' })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  async refresh(
    @Req() request: Request,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE] as string;
    const result = await this.refreshTokenService.refreshToken(
      refreshToken,
      userAgent,
      ipAddress,
    );

    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear refresh cookie' })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponse> {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE] as string;
    await this.logoutService.logout(refreshToken);

    response.clearCookie(
      REFRESH_TOKEN_COOKIE,
      buildRefreshTokenClearCookieOptions(),
    );

    return { message: AUTH_MESSAGES.LOGGED_OUT };
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): void {
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      buildRefreshTokenCookieOptions(),
    );
  }
}
