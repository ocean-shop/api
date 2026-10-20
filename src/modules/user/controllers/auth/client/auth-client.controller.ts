import { Controller, Post, Body, Res, Headers, Ip } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { REFRESH_TOKEN_COOKIE } from '../../../constants/auth.constants';
import { buildRefreshTokenCookieOptions } from '../../../helpers/auth-cookie.helpers';
import { AuthResponse } from '../../../models/auth.models';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../../dto/verify-client-otp.dto';

@Controller('user/auth/client')
@ApiTags('User Auth Client')
export class AuthClientController {
  constructor(private readonly authClientService: AuthClientService) {}

  @Post('request-otp')
  @ApiOperation({
    summary: 'Request client OTP code (creates user if not exists)',
  })
  @ApiBody({ type: RequestClientOtpDto })
  async requestOtp(
    @Body() requestClientOtpDto: RequestClientOtpDto,
  ): Promise<MessageResponse> {
    return await this.authClientService.requestOtp(requestClientOtpDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify client OTP and issue tokens' })
  @ApiBody({ type: VerifyClientOtpDto })
  async verifyOtp(
    @Body() verifyClientOtpDto: VerifyClientOtpDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authClientService.verifyOtp(
      verifyClientOtpDto,
      userAgent,
      ipAddress,
    );

    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
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
