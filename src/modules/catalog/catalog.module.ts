import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './controllers/categories/categories.controller';
import { ProductsController } from './controllers/products/products.controller';
import { ShopsController } from './controllers/shops/shops.controller';
import { TagsController } from './controllers/tags/tags.controller';
import { AttributesController } from './controllers/attributes/attributes.controller';
import { Attribute } from './entities/attribute.entity';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { Shop } from './entities/shop.entity';
import { Tag } from './entities/tag.entity';
import { AttributeRepository } from './repositories/attribute/attribute.repository';
import { CategoryRepository } from './repositories/category/category.repository';
import { ProductRepository } from './repositories/product/product.repository';
import { ShopRepository } from './repositories/shop/shop.repository';
import { TagRepository } from './repositories/tag/tag.repository';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { CategoriesService } from './services/categories/categories.service';
import { ProductsService } from './services/products/products.service';
import { ShopsService } from './services/shops/shops.service';
import { TagsService } from './services/tags/tags.service';
import { AttributesService } from './services/attributes/attributes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shop,
      Category,
      Tag,
      Attribute,
      Product,
      ProductImage,
    ]),
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
    ProductsController,
  ],
  providers: [
    ShopsService,
    CategoriesService,
    TagsService,
    AttributesService,
    ProductsService,
    ShopRepository,
    CategoryRepository,
    TagRepository,
    AttributeRepository,
    ProductRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CatalogModule {}
