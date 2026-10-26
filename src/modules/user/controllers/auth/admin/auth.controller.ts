import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Headers,
  Ip,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { RequestOtpService } from '../../../services/request-otp/request-otp.service';
import { VerifyOtpService } from '../../../services/verify-otp/verify-otp.service';
import { RefreshTokenService } from '../../../services/refresh-token/refresh-token.service';
import { LogoutService } from '../../../services/logout/logout.service';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../../constants/auth-messages.constants';
import { ADMIN_ROLES } from '../../../constants/role.constants';
import {
  OTP_REQUEST_THROTTLE_LIMIT,
  OTP_THROTTLE_WINDOW_MS,
  OTP_THROTTLER,
  OTP_VERIFY_THROTTLE_LIMIT,
  ADMIN_REFRESH_TOKEN_COOKIE,
} from '../../../constants/auth.constants';
import {
  buildRefreshTokenClearCookieOptions,
  sendAuthSession,
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
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [OTP_THROTTLER]: {
      limit: OTP_REQUEST_THROTTLE_LIMIT,
      ttl: OTP_THROTTLE_WINDOW_MS,
    },
  })
  @ApiOperation({ summary: 'Request admin OTP code' })
  @ApiBody({ type: RequestOtpDto })
  @ApiTooManyRequestsResponse({ description: AUTH_MESSAGES.TOO_MANY_REQUESTS })
  async requestOtp(
    @Body() requestOtpDto: RequestOtpDto,
  ): Promise<MessageResponse> {
    return await this.requestOtpService.requestAdminOtp(requestOtpDto);
  }

  @Post('verify-otp')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [OTP_THROTTLER]: {
      limit: OTP_VERIFY_THROTTLE_LIMIT,
      ttl: OTP_THROTTLE_WINDOW_MS,
    },
  })
  @ApiOperation({
    summary: 'Verify admin OTP; the refresh token is set as an httpOnly cookie',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiTooManyRequestsResponse({ description: AUTH_MESSAGES.TOO_MANY_REQUESTS })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const session = await this.verifyOtpService.verifyOtp(
      verifyOtpDto,
      userAgent,
      ipAddress,
    );

    return sendAuthSession(response, session, ADMIN_REFRESH_TOKEN_COOKIE);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token by refresh cookie' })
  @ApiCookieAuth(ADMIN_REFRESH_TOKEN_COOKIE)
  async refresh(
    @Req() request: Request,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = request.cookies[ADMIN_REFRESH_TOKEN_COOKIE] as string;
    const session = await this.refreshTokenService.refreshToken(
      refreshToken,
      ADMIN_ROLES,
      userAgent,
      ipAddress,
    );

    return sendAuthSession(response, session, ADMIN_REFRESH_TOKEN_COOKIE);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear refresh cookie' })
  @ApiCookieAuth(ADMIN_REFRESH_TOKEN_COOKIE)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponse> {
    const refreshToken = request.cookies[ADMIN_REFRESH_TOKEN_COOKIE] as string;
    await this.logoutService.logout(refreshToken);

    response.clearCookie(
      ADMIN_REFRESH_TOKEN_COOKIE,
      buildRefreshTokenClearCookieOptions(),
    );

    return { message: AUTH_MESSAGES.LOGGED_OUT };
  }
}
