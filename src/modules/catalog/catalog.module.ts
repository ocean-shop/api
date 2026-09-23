import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './controllers/categories/admin/categories.controller';
import { ProductsController } from './controllers/products/admin/products.controller';
import { ShopsController } from './controllers/shops/shops.controller';
import { TagsController } from './controllers/tags/tags.controller';
import { AttributesController } from './controllers/attributes/attributes.controller';
import { ImagesController } from './controllers/images/images.controller';
import { Attribute } from './entities/attribute.entity';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { Shop } from './entities/shop.entity';
import { Tag } from './entities/tag.entity';
import { ProductVariation } from './entities/product-variation.entity';
import { VariationAttribute } from './entities/variation-attribute.entity';
import { VariationImage } from './entities/variation-image.entity';
import { AttributeRepository } from './repositories/attribute/attribute.repository';
import { CategoryRepository } from './repositories/category/admin/category.repository';
import { CategoryClientRepository } from './repositories/category/client/category-client.repository';
import { ProductRepository } from './repositories/product/admin/product.repository';
import { ProductClientRepository } from './repositories/product/client/product-client.repository';
import { ProductVariationRepository } from './repositories/product-variation/product-variation.repository';
import { ShopRepository } from './repositories/shop/shop.repository';
import { TagRepository } from './repositories/tag/tag.repository';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { CategoriesService } from './services/categories/admin/categories.service';
import { CategoriesClientService } from './services/categories/client/categories-client.service';
import { ProductImagesCloudinaryService } from './services/cloudinary/product-images-cloudinary.service';
import { ProductsService } from './services/products/admin/products.service';
import { ProductsClientService } from './services/products/client/products-client.service';
import { ShopsService } from './services/shops/shops.service';
import { TagsService } from './services/tags/tags.service';
import { AttributesService } from './services/attributes/attributes.service';
import { ImagesService } from './services/images/images.service';
import { ProductsClientController } from './controllers/products/client/products-client.controller';
import { CategoriesClientController } from './controllers/categories/client/categories-client.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shop,
      Category,
      Tag,
      Attribute,
      Product,
      ProductImage,
      ProductVariation,
      VariationAttribute,
      VariationImage,
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
    CategoriesClientController,
    TagsController,
    AttributesController,
    ProductsController,
    ProductsClientController,
    ImagesController,
  ],
  providers: [
    ShopsService,
    CategoriesService,
    CategoriesClientService,
    TagsService,
    AttributesService,
    ProductsService,
    ProductsClientService,
    ImagesService,
    ProductImagesCloudinaryService,
    ShopRepository,
    CategoryRepository,
    CategoryClientRepository,
    TagRepository,
    AttributeRepository,
    ProductRepository,
    ProductClientRepository,
    ProductVariationRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CatalogModule {}
