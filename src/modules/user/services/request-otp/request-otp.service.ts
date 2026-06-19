import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { RequestOtpDto } from '../../dto/request-otp.dto';
import { OtpPurpose } from '../../entities/enums/auth-otp.enum';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class RequestOtpService {
  private readonly logger = new Logger(RequestOtpService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    this.validateContactInfo(dto.email, dto.phone);

    const user = await this.findUser(dto.email, dto.phone);
    await this.validateUserAccess(user, dto.email, dto.phone);

    await this.handleExistingUserOtp(user, dto.email, dto.phone);

    return { message: 'OTP sent successfully' };
  }

  private validateContactInfo(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }
  }

  private async findUser(email?: string, phone?: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: email ? { email } : { mobileNumber: phone },
      relations: {
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private async validateUserAccess(
    user: User,
    email?: string,
    phone?: string,
  ): Promise<void> {
    if (user.role?.name !== 'admin') {
      throw new BadRequestException('Access denied');
    }
    await this.authService.checkActiveOtpRequest(user.id);
    if (!this.authService.isUserVerified(user, email, phone)) {
      throw new BadRequestException('User not found');
    }
  }

  private async handleExistingUserOtp(
    user: User,
    email: string | undefined,
    phone: string | undefined,
  ) {
    const purpose = OtpPurpose.LOGIN;
    await this.createAndSendOtp(user.id, email, phone, purpose);
  }

  private async createAndSendOtp(
    userId: string,
    email: string | undefined,
    phone: string | undefined,
    purpose: OtpPurpose,
  ) {
    const { code, codeHash } = await this.authService.generateOtpCodeAndHash();
    await this.authService.saveOtp(userId, codeHash, email, purpose);

    if (email) {
      await this.emailService.sendOtpEmail(email, code);
      return;
    }

    // No SMS provider yet: keep logging the code for the phone channel.
    this.logger.log(`Generated OTP code for ${phone}: ${code}`);
  }
}
