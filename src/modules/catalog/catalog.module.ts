import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopsController } from './controllers/shops/shops.controller';
import { Shop } from './entities/shop.entity';
import { ShopRepository } from './repositories/shop/shop.repository';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { ShopsService } from './services/shops/shops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ShopsController],
  providers: [ShopsService, ShopRepository, JwtAuthGuard, RolesGuard],
})
export class CatalogModule {}
