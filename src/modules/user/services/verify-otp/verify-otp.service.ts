import { Injectable } from '@nestjs/common';
import { ADMIN_ROLES } from '../../constants/role.constants';
import { User } from '../../entities/user.entity';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { assertCanSignIn } from '../../helpers/access.helpers';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../user-session/user-session.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { AuthSession } from '../../models/auth.models';

@Injectable()
export class VerifyOtpService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly userSessionService: UserSessionService,
  ) {}

  async verifyOtp(
    dto: VerifyOtpDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSession> {
    const user = await this.userRepository.findByEmailOrPhone(
      dto.email,
      dto.phone,
    );

    assertCanSignIn(user, ADMIN_ROLES);
    await this.processOtp(user, dto.code, dto.email, dto.phone);

    return this.userSessionService.startSession(user, { userAgent, ipAddress });
  }

  private async processOtp(
    user: User,
    code: string,
    email?: string,
    phone?: string,
  ): Promise<void> {
    const latestOtp = await this.authService.findAndValidateLatestOtp(user.id);
    await this.authService.consumeOtp(code, latestOtp);
    await this.authService.verifyUserIfRegistered(
      latestOtp,
      user,
      email,
      phone,
    );
  }
}
