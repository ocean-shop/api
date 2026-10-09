import { Controller, Post, Body, Res, Headers, Ip } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
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
  async requestOtp(@Body() requestClientOtpDto: RequestClientOtpDto) {
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
  ) {
    const result = await this.authClientService.verifyOtp(
      verifyClientOtpDto,
      userAgent,
      ipAddress,
    );

    this.setRefreshTokenCookie(response, result.refreshToken);

    return result;
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
