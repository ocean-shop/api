import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthClientService } from '../../../services/auth-client/auth-client.service';
import { RequestClientOtpDto } from '../../../dto/request-client-otp.dto';

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
}
