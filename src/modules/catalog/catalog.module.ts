import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './controllers/categories/categories.controller';
import { ShopsController } from './controllers/shops/shops.controller';
import { TagsController } from './controllers/tags/tags.controller';
import { Category } from './entities/category.entity';
import { Shop } from './entities/shop.entity';
import { Tag } from './entities/tag.entity';
import { CategoryRepository } from './repositories/category/category.repository';
import { ShopRepository } from './repositories/shop/shop.repository';
import { TagRepository } from './repositories/tag/tag.repository';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { CategoriesService } from './services/categories/categories.service';
import { ShopsService } from './services/shops/shops.service';
import { TagsService } from './services/tags/tags.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, Category, Tag]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ShopsController, CategoriesController, TagsController],
  providers: [
    ShopsService,
    CategoriesService,
    TagsService,
    ShopRepository,
    CategoryRepository,
    TagRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CatalogModule {}
