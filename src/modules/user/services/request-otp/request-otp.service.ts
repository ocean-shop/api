import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { RequestOtpDto } from '../../dto/request-otp.dto';
import { OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { ADMIN_ROLES } from '../../constants/role.constants';
import { assertCanSignIn } from '../../helpers/access/access.helpers';
import { USER_MESSAGES } from '../../constants/user-messages.constants';

@Injectable()
export class RequestOtpService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async requestAdminOtp(dto: RequestOtpDto): Promise<MessageResponse> {
    this.validateContactInfo(dto.email, dto.phone);
    const user = await this.userRepository.findByEmailOrPhone(
      dto.email,
      dto.phone,
    );
    await this.validateAdminAccess(user, dto.email, dto.phone);
    await this.handleExistingUserOtp(user, dto.email, dto.phone);
    return { message: AUTH_MESSAGES.OTP_SENT };
  }

  private validateContactInfo(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException(AUTH_MESSAGES.CONTACT_REQUIRED);
    }
  }

  private async validateAdminAccess(
    user: User,
    email?: string,
    phone?: string,
  ): Promise<void> {
    assertCanSignIn(user, ADMIN_ROLES);
    await this.authService.checkActiveOtpRequest(user.id);
    if (!this.authService.isUserVerified(user, email, phone)) {
      throw new BadRequestException(USER_MESSAGES.NOT_FOUND);
    }
  }

  private async handleExistingUserOtp(
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ): Promise<void> {
    const purpose = OtpPurpose.LOGIN;
    await this.createAndSendOtp(user.id, email, phone, purpose);
  }

  async createAndSendOtp(
    userId: string,
    email: string | undefined,
    phone: string | undefined,
    purpose: OtpPurpose,
  ): Promise<void> {
    const { code, codeHash } = await this.authService.generateOtpCodeAndHash();
    await this.authService.saveOtp(userId, codeHash, email, purpose);

    if (email) {
      await this.emailService.sendOtpEmail(email, code);
      return;
    }

    if (!phone) {
      throw new BadRequestException(AUTH_MESSAGES.CONTACT_REQUIRED);
    }

    await this.smsService.sendOtpSms(phone, code);
  }
}
