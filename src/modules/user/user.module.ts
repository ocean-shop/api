import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserSession } from './entities/user-session.entity';
import { OauthAccount } from './entities/oauth-account.entity';
import { AuthOtp } from './entities/auth-otp.entity';
import { AuthController } from './controllers/auth.controller';
import { UserRepository } from './repositories/user/user.repository';
import { AuthOtpRepository } from './repositories/auth-otp/auth-otp.repository';
import { UserSessionRepository } from './repositories/user-session/user-session.repository';
import { AuthService } from './services/auth/auth.service';
import { RequestOtpService } from './services/request-otp/request-otp.service';
import { VerifyOtpService } from './services/verify-otp/verify-otp.service';
import { RefreshTokenService } from './services/refresh-token/refresh-token.service';
import { LogoutService } from './services/logout/logout.service';
import { EmailService } from './services/email/email.service';
import { EmailProcessor } from './processors/email.processor';
import { isEmailQueueEnabled } from '../../core/queue/helpers/queue.helpers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      UserSession,
      OauthAccount,
      AuthOtp,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    UserRepository,
    AuthOtpRepository,
    UserSessionRepository,
    AuthService,
    RequestOtpService,
    VerifyOtpService,
    RefreshTokenService,
    LogoutService,
    EmailService,
    // The processor only runs when the BullMQ queue is enabled.
    ...(isEmailQueueEnabled() ? [EmailProcessor] : []),
  ],
  exports: [
    TypeOrmModule,
    UserRepository,
    AuthOtpRepository,
    UserSessionRepository,
    AuthService,
    RequestOtpService,
    VerifyOtpService,
    RefreshTokenService,
    LogoutService,
  ],
})
export class UserModule {}
