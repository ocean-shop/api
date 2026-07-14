import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './controllers/categories/categories.controller';
import { ShopsController } from './controllers/shops/shops.controller';
import { Category } from './entities/category.entity';
import { Shop } from './entities/shop.entity';
import { CategoryRepository } from './repositories/category/category.repository';
import { ShopRepository } from './repositories/shop/shop.repository';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { CategoriesService } from './services/categories/categories.service';
import { ShopsService } from './services/shops/shops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, Category]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ShopsController, CategoriesController],
  providers: [
    ShopsService,
    CategoriesService,
    ShopRepository,
    CategoryRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CatalogModule {}
