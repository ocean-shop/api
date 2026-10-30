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
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { RefreshTokenService } from '../../../services/refresh-token/refresh-token.service';
import { LogoutService } from '../../../services/logout/logout.service';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../../constants/auth-messages.constants';
import { ROLES } from '../../../constants/role.constants';
import {
  CLIENT_REFRESH_TOKEN_COOKIE,
  OTP_REQUEST_THROTTLE_LIMIT,
  OTP_THROTTLE_WINDOW_MS,
  OTP_THROTTLER,
  OTP_VERIFY_THROTTLE_LIMIT,
} from '../../../constants/auth.constants';
import {
  buildRefreshTokenClearCookieOptions,
  sendAuthSession,
} from '../../../helpers/auth-cookie/auth-cookie.helpers';
import { AuthResponse } from '../../../models/auth.models';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../../dto/verify-client-otp.dto';

@Controller('user/auth/client')
@ApiTags('User Auth Client')
export class AuthClientController {
  constructor(
    private readonly authClientService: AuthClientService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('request-otp')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [OTP_THROTTLER]: {
      limit: OTP_REQUEST_THROTTLE_LIMIT,
      ttl: OTP_THROTTLE_WINDOW_MS,
    },
  })
  @ApiOperation({
    summary: 'Request client OTP code (creates user if not exists)',
  })
  @ApiBody({ type: RequestClientOtpDto })
  @ApiTooManyRequestsResponse({ description: AUTH_MESSAGES.TOO_MANY_REQUESTS })
  async requestOtp(
    @Body() requestClientOtpDto: RequestClientOtpDto,
  ): Promise<MessageResponse> {
    return await this.authClientService.requestOtp(requestClientOtpDto);
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
    summary:
      'Verify client OTP; the refresh token is set as an httpOnly cookie',
  })
  @ApiBody({ type: VerifyClientOtpDto })
  @ApiTooManyRequestsResponse({ description: AUTH_MESSAGES.TOO_MANY_REQUESTS })
  async verifyOtp(
    @Body() verifyClientOtpDto: VerifyClientOtpDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const session = await this.authClientService.verifyOtp(
      verifyClientOtpDto,
      userAgent,
      ipAddress,
    );

    return sendAuthSession(response, session, CLIENT_REFRESH_TOKEN_COOKIE);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh client access token by refresh cookie' })
  @ApiCookieAuth(CLIENT_REFRESH_TOKEN_COOKIE)
  async refresh(
    @Req() request: Request,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = request.cookies[CLIENT_REFRESH_TOKEN_COOKIE] as string;
    const session = await this.refreshTokenService.refreshToken(
      refreshToken,
      [ROLES.USER],
      userAgent,
      ipAddress,
    );

    return sendAuthSession(response, session, CLIENT_REFRESH_TOKEN_COOKIE);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout client and clear refresh cookie' })
  @ApiCookieAuth(CLIENT_REFRESH_TOKEN_COOKIE)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponse> {
    const refreshToken = request.cookies[CLIENT_REFRESH_TOKEN_COOKIE] as string;
    await this.logoutService.logout(refreshToken);

    response.clearCookie(
      CLIENT_REFRESH_TOKEN_COOKIE,
      buildRefreshTokenClearCookieOptions(),
    );

    return { message: AUTH_MESSAGES.LOGGED_OUT };
  }
}
