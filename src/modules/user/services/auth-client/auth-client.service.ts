import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { UKRAINIAN_PHONE_REGEX } from '../../constants/phone.constants';
import { ROLES } from '../../constants/role.constants';
import { USER_MESSAGES } from '../../constants/user-messages.constants';
import { SHOP_MESSAGES } from '../../../catalog/constants/shop-messages.constants';
import { User } from '../../entities/user.entity';
import { RequestClientOtpDto } from '../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../dto/verify-client-otp.dto';
import { OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { assertCanSignIn } from '../../helpers/access/access.helpers';
import { AuthSession, LoginIdentity } from '../../models/auth.models';
import { AuthService } from '../auth/auth.service';
import { RequestOtpService } from '../request-otp/request-otp.service';
import { UserSessionService } from '../user-session/user-session.service';
import { AuthClientRepository } from '../../repositories/auth-client/auth-client.repository';

@Injectable()
export class AuthClientService {
  constructor(
    private readonly authClientRepository: AuthClientRepository,
    private readonly authService: AuthService,
    private readonly requestOtpService: RequestOtpService,
    private readonly userSessionService: UserSessionService,
  ) {}

  async requestOtp(dto: RequestClientOtpDto): Promise<MessageResponse> {
    const { email, phone } = this.parseLogin(dto.login);
    const existingUser = await this.authClientRepository.findByEmailOrPhone(
      email,
      phone,
    );

    if (existingUser) {
      await this.validateClientAccess(existingUser);
      const purpose = this.authService.isUserVerified(
        existingUser,
        email,
        phone,
      )
        ? OtpPurpose.LOGIN
        : OtpPurpose.REGISTER;
      await this.requestOtpService.createAndSendOtp(
        existingUser.id,
        email,
        phone,
        purpose,
      );
      return { message: AUTH_MESSAGES.OTP_SENT };
    }

    const newUser = await this.createClient(email, phone);
    await this.requestOtpService.createAndSendOtp(
      newUser.id,
      email,
      phone,
      OtpPurpose.REGISTER,
    );
    return { message: AUTH_MESSAGES.OTP_SENT };
  }

  async verifyOtp(
    dto: VerifyClientOtpDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSession> {
    const { email, phone } = this.parseLogin(dto.login);
    const user = await this.authClientRepository.findByEmailOrPhone(
      email,
      phone,
    );

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    this.assertClient(user);
    await this.assertShopExists(dto.shopId);
    await this.processOtp(user, dto.code, email, phone);
    await this.authClientRepository.bindUserToShop(user.id, dto.shopId);

    return this.userSessionService.startSession(user, { userAgent, ipAddress });
  }

  private async assertShopExists(shopId: string): Promise<void> {
    const exists = await this.authClientRepository.shopExists(shopId);
    if (!exists) {
      throw new NotFoundException(SHOP_MESSAGES.NOT_FOUND);
    }
  }

  private parseLogin(login: string): LoginIdentity {
    const value = login.trim();

    if (isEmail(value)) {
      return { email: value };
    }

    if (UKRAINIAN_PHONE_REGEX.test(value)) {
      return { phone: value };
    }

    throw new BadRequestException(AUTH_MESSAGES.INVALID_LOGIN);
  }

  private async validateClientAccess(user: User): Promise<void> {
    this.assertClient(user);
    await this.authService.checkActiveOtpRequest(user.id);
  }

  private assertClient(user: User): void {
    assertCanSignIn(user, [ROLES.USER]);
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

  private async createClient(email?: string, phone?: string): Promise<User> {
    const role = await this.authClientRepository.findRoleByName(ROLES.USER);
    if (!role) {
      throw new BadRequestException(
        AUTH_MESSAGES.roleNotConfigured(ROLES.USER),
      );
    }

    return this.authClientRepository.createUser({
      email: email ?? null,
      mobileNumber: phone ?? null,
      isActive: true,
      isEmailVerified: false,
      isMobileVerified: false,
      role,
    });
  }
}
