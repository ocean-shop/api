import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { UKRAINIAN_PHONE_REGEX } from '../../constants/phone.constants';
import { ROLES } from '../../constants/role.constants';
import { USER_MESSAGES } from '../../constants/user-messages.constants';
import { User } from '../../entities/user.entity';
import { RequestClientOtpDto } from '../../dto/request-client-otp.dto';
import { VerifyClientOtpDto } from '../../dto/verify-client-otp.dto';
import { OtpPurpose } from '../../entities/enums/auth-otp.enum';
import {
  buildRefreshTokenExpiryDate,
  hashRefreshToken,
} from '../../helpers/user-session.helpers';
import { AuthResponse, LoginIdentity } from '../../models/auth.models';
import { AuthService } from '../auth/auth.service';
import { RequestOtpService } from '../request-otp/request-otp.service';
import { AuthClientRepository } from '../../repositories/auth-client/auth-client.repository';

@Injectable()
export class AuthClientService {
  constructor(
    private readonly authClientRepository: AuthClientRepository,
    private readonly authService: AuthService,
    private readonly requestOtpService: RequestOtpService,
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
  ): Promise<AuthResponse> {
    const { email, phone } = this.parseLogin(dto.login);
    const user = await this.authClientRepository.findByEmailOrPhone(
      email,
      phone,
    );

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    this.assertClient(user);
    await this.processOtp(user, dto.code, email, phone);

    const { accessToken, refreshToken } = this.authService.generateTokens(user);
    await this.authClientRepository.createSession({
      userId: user.id,
      refreshTokenHash: await hashRefreshToken(refreshToken),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: buildRefreshTokenExpiryDate(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role.name,
      },
    };
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
    if (user.role?.name !== ROLES.USER) {
      throw new BadRequestException(AUTH_MESSAGES.ACCESS_DENIED);
    }
    if (!user.isActive) {
      throw new ForbiddenException(AUTH_MESSAGES.USER_BLOCKED);
    }
  }

  private async processOtp(
    user: User,
    code: string,
    email?: string,
    phone?: string,
  ): Promise<void> {
    const latestOtp = await this.authService.findAndValidateLatestOtp(user.id);
    await this.authService.validateOtpCode(code, latestOtp);

    latestOtp.usedAt = new Date();
    await this.authService.saveAuthOtp(latestOtp);
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
