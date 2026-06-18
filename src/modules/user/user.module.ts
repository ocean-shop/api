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
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
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
    AuthService,
    EmailService,
    // The processor only runs when the BullMQ queue is enabled.
    ...(isEmailQueueEnabled() ? [EmailProcessor] : []),
  ],
  exports: [TypeOrmModule, AuthService],
})
export class UserModule {}
