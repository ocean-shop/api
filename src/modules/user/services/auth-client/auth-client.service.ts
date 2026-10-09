import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isEmail } from 'class-validator';
import { User } from '../../entities/user.entity';
import { RequestClientOtpDto } from '../../dto/request-client-otp.dto';
import { OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { AuthService } from '../auth/auth.service';
import { RequestOtpService } from '../request-otp/request-otp.service';
import { AuthClientRepository } from '../../repositories/auth-client/auth-client.repository';

const CLIENT_ROLE_NAME = 'user';
const UKRAINIAN_PHONE_REGEX = /^(\+380|380|0)\d{9}$/;

@Injectable()
export class AuthClientService {
  constructor(
    private readonly authClientRepository: AuthClientRepository,
    private readonly authService: AuthService,
    private readonly requestOtpService: RequestOtpService,
  ) {}

  async requestOtp(dto: RequestClientOtpDto): Promise<{ message: string }> {
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
      return { message: 'OTP-код успішно надіслано' };
    }

    const newUser = await this.createClient(email, phone);
    await this.requestOtpService.createAndSendOtp(
      newUser.id,
      email,
      phone,
      OtpPurpose.REGISTER,
    );
    return { message: 'OTP-код успішно надіслано' };
  }

  private parseLogin(login: string): { email?: string; phone?: string } {
    const value = login.trim();

    if (isEmail(value)) {
      return { email: value };
    }

    if (UKRAINIAN_PHONE_REGEX.test(value)) {
      return { phone: value };
    }

    throw new BadRequestException('Вкажіть коректний email або номер телефону');
  }

  private async validateClientAccess(user: User): Promise<void> {
    if (user.role?.name !== CLIENT_ROLE_NAME) {
      throw new BadRequestException('Доступ заборонено');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Користувача заблоковано');
    }
    await this.authService.checkActiveOtpRequest(user.id);
  }

  private async createClient(email?: string, phone?: string): Promise<User> {
    const role =
      await this.authClientRepository.findRoleByName(CLIENT_ROLE_NAME);
    if (!role) {
      throw new BadRequestException(`Роль ${CLIENT_ROLE_NAME} не налаштована`);
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
