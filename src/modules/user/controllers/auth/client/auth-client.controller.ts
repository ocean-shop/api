import {
  Controller,
  Post,
  Body,
  Res,
  Headers,
  Ip,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../../constants/auth-messages.constants';
import {
  OTP_REQUEST_THROTTLE_LIMIT,
  OTP_THROTTLE_WINDOW_MS,
  OTP_THROTTLER,
  OTP_VERIFY_THROTTLE_LIMIT,
} from '../../../constants/auth.constants';
import { sendAuthSession } from '../../../helpers/auth-cookie.helpers';
import { AuthResponse } from '../../../models/auth.models';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../../dto/verify-client-otp.dto';

@Controller('user/auth/client')
@ApiTags('User Auth Client')
@UseGuards(ThrottlerGuard)
@ApiTooManyRequestsResponse({ description: AUTH_MESSAGES.TOO_MANY_REQUESTS })
export class AuthClientController {
  constructor(private readonly authClientService: AuthClientService) {}

  @Post('request-otp')
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
  async requestOtp(
    @Body() requestClientOtpDto: RequestClientOtpDto,
  ): Promise<MessageResponse> {
    return await this.authClientService.requestOtp(requestClientOtpDto);
  }

  @Post('verify-otp')
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

    return sendAuthSession(response, session);
  }
}
