import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserSession } from './entities/user-session.entity';
import { OauthAccount } from './entities/oauth-account.entity';
import { AuthOtp } from './entities/auth-otp.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserShipping } from './entities/user-shipping.entity';
import { Shop } from '../catalog/entities/shop.entity';
import { Order } from '../orders/entities/order.entity';
import { CatalogModule } from '../catalog/catalog.module';
import { AuthController } from './controllers/auth/admin/auth.controller';
import { AuthClientController } from './controllers/auth/client/auth-client.controller';
import { SettingsController } from './controllers/settings/settings.controller';
import { AdminsController } from './controllers/admins/admins.controller';
import { UsersController } from './controllers/users/admin/users.controller';
import { ProfileController } from './controllers/users/client/profile-client/profile-client.controller';
import { ShippingController } from './controllers/users/client/shippng-client/shipping-client.controller';
import { DashboardController } from './controllers/users/client/dashboard-client/dashboard-client.controller';
import { ContactsController } from './controllers/users/client/contacts/contacts-client.controller';
import { UserRepository } from './repositories/user/user.repository';
import { AuthOtpRepository } from './repositories/auth-otp/auth-otp.repository';
import { UserSessionRepository } from './repositories/user-session/user-session.repository';
import { SettingsRepository } from './repositories/settings/settings.repository';
import { ProfileRepository } from './repositories/profile/profile.repository';
import { ShippingRepository } from './repositories/shipping/shipping.repository';
import { DashboardRepository } from './repositories/dashboard/dashboard.repository';
import { UsersRepository } from './repositories/users/users.repository';
import { AuthClientRepository } from './repositories/auth-client/auth-client.repository';
import { AuthService } from './services/auth/auth.service';
import { AuthClientService } from './services/auth-client/auth-client.service';
import { RequestOtpService } from './services/request-otp/request-otp.service';
import { VerifyOtpService } from './services/verify-otp/verify-otp.service';
import { RefreshTokenService } from './services/refresh-token/refresh-token.service';
import { LogoutService } from './services/logout/logout.service';
import { UserSessionService } from './services/user-session/user-session.service';
import { EmailService } from './services/email/email.service';
import { SmsService } from './services/sms/sms.service';
import { SettingsService } from './services/settings/settings.service';
import { ProfileService } from './services/profile/profile.service';
import { ShippingService } from './services/shipping/shipping.service';
import { DashboardService } from './services/dashboard/dashboard.service';
import { ContactsService } from './services/contacts/contacts.service';
import { AdminsService } from './services/admins/admins.service';
import { UsersService } from './services/users/users.service';
import { EmailProcessor } from './processors/email/email.processor';
import { isEmailQueueEnabled } from '../../core/queue/helpers/queue/queue.helpers';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles/roles.guard';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  JWT_ACCESS_SECRET_KEY,
  OTP_REQUEST_THROTTLE_LIMIT,
  OTP_THROTTLE_WINDOW_MS,
  OTP_THROTTLER,
} from './constants/auth.constants';
import { AUTH_MESSAGES } from './constants/auth-messages.constants';
import { resolveOtpThrottleTracker } from './helpers/otp-throttle/otp-throttle.helpers';

/**
 * Global because every feature module guards its routes with `JwtAuthGuard`,
 * which needs `UserRepository`, and catalog and user import each other.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      UserSession,
      OauthAccount,
      AuthOtp,
      UserSettings,
      UserProfile,
      UserShipping,
      Shop,
      Order,
    ]),
    // Registered once for the whole app; startup fails without a secret.
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(JWT_ACCESS_SECRET_KEY),
        signOptions: { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
      }),
      inject: [ConfigService],
    }),
    // In-memory counters; routes opt in with ThrottlerGuard and @Throttle.
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: OTP_THROTTLER,
          limit: OTP_REQUEST_THROTTLE_LIMIT,
          ttl: OTP_THROTTLE_WINDOW_MS,
        },
      ],
      getTracker: resolveOtpThrottleTracker,
      errorMessage: AUTH_MESSAGES.TOO_MANY_REQUESTS,
    }),
    CatalogModule,
  ],
  controllers: [
    AuthController,
    AuthClientController,
    SettingsController,
    AdminsController,
    UsersController,
    ProfileController,
    ShippingController,
    DashboardController,
    ContactsController,
  ],
  providers: [
    UserRepository,
    AuthOtpRepository,
    UserSessionRepository,
    SettingsRepository,
    ProfileRepository,
    ShippingRepository,
    DashboardRepository,
    UsersRepository,
    AuthClientRepository,
    AuthService,
    AuthClientService,
    RequestOtpService,
    VerifyOtpService,
    RefreshTokenService,
    LogoutService,
    UserSessionService,
    EmailService,
    SmsService,
    SettingsService,
    ProfileService,
    ShippingService,
    DashboardService,
    ContactsService,
    AdminsService,
    UsersService,
    JwtAuthGuard,
    RolesGuard,
    // The processor only runs when the BullMQ queue is enabled.
    ...(isEmailQueueEnabled() ? [EmailProcessor] : []),
  ],
  exports: [
    TypeOrmModule,
    UserRepository,
    AuthOtpRepository,
    UserSessionRepository,
    SettingsRepository,
    AuthService,
    RequestOtpService,
    VerifyOtpService,
    RefreshTokenService,
    LogoutService,
    SettingsService,
    AdminsService,
    UsersRepository,
    UsersService,
    UserSessionService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class UserModule {}
