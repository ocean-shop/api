import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './controllers/categories/categories.controller';
import { ShopsController } from './controllers/shops/shops.controller';
import { TagsController } from './controllers/tags/tags.controller';
import { AttributesController } from './controllers/attributes/attributes.controller';
import { Attribute } from './entities/attribute.entity';
import { Category } from './entities/category.entity';
import { Shop } from './entities/shop.entity';
import { Tag } from './entities/tag.entity';
import { AttributeRepository } from './repositories/attribute/attribute.repository';
import { CategoryRepository } from './repositories/category/category.repository';
import { ShopRepository } from './repositories/shop/shop.repository';
import { TagRepository } from './repositories/tag/tag.repository';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { CategoriesService } from './services/categories/categories.service';
import { ShopsService } from './services/shops/shops.service';
import { TagsService } from './services/tags/tags.service';
import { AttributesService } from './services/attributes/attributes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shop, Category, Tag, Attribute]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    ShopsController,
    CategoriesController,
    TagsController,
    AttributesController,
  ],
  providers: [
    ShopsService,
    CategoriesService,
    TagsService,
    AttributesService,
    ShopRepository,
    CategoryRepository,
    TagRepository,
    AttributeRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CatalogModule {}
