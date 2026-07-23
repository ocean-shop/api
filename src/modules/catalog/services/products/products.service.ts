import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AssignProductAttributeDto } from '../../dto/assign-product-attribute.dto';
import { AssignProductCategoryDto } from '../../dto/assign-product-category.dto';
import { AssignProductImagesDto } from '../../dto/assign-product-images.dto';
import { AssignProductTagDto } from '../../dto/assign-product-tag.dto';
import { CreateProductDto } from '../../dto/create-product.dto';
import { ListProductsQueryDto } from '../../dto/list-products-query.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductStatus, ProductType } from '../../entities/enums/product.enum';
import { Product } from '../../entities/product.entity';
import { ProductListResponse } from '../../models/product.models';
import { AttributeRepository } from '../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../repositories/category/category.repository';
import { ProductRepository } from '../../repositories/product/product.repository';
import { ShopRepository } from '../../repositories/shop/shop.repository';
import { TagRepository } from '../../repositories/tag/tag.repository';
import { PAGINATION_MAX } from '../../constants/pagination.constants';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly shopRepository: ShopRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
    private readonly attributeRepository: AttributeRepository,
  ) {}

  async listProducts(
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;

    const { items, total } = await this.productRepository.findAllPaginated(
      {
        shopId: query.shopId,
        status: query.status,
        name: query.name,
        sku: query.sku,
        categoryIds: query.categoryIds,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      skip,
      limit,
    );

    return this.toListResponse(items, total, page, limit);
  }

  async listProductsByCategoryId(
    categoryId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.categoryRepository.findById(categoryId);

    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;

    const { items, total } =
      await this.productRepository.findByCategoryIdPaginated(
        categoryId,
        skip,
        limit,
        query.sortBy,
        query.sortOrder,
      );

    return this.toListResponse(items, total, page, limit);
  }

  async listProductsByTagId(
    tagId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.tagRepository.findById(tagId);

    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;

    const { items, total } = await this.productRepository.findByTagIdPaginated(
      tagId,
      skip,
      limit,
      query.sortBy,
      query.sortOrder,
    );

    return this.toListResponse(items, total, page, limit);
  }

  async listProductsByAttributeTypeId(
    attributeTypeId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.attributeRepository.findById(attributeTypeId);

    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;

    const { items, total } =
      await this.productRepository.findByAttributeTypeIdPaginated(
        attributeTypeId,
        skip,
        limit,
        query.sortBy,
        query.sortOrder,
      );

    return this.toListResponse(items, total, page, limit);
  }

  async getProductById(id: string): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    await this.shopRepository.findById(dto.shopId);

    const price = dto.price ?? 0;
    const oldPrice = dto.oldPrice ?? null;
    this.assertOldPriceValid(price, oldPrice);

    if (dto.sku) {
      await this.ensureSkuUniqueInShop(dto.shopId, dto.sku);
    }

    const product = this.productRepository.create({
      shopId: dto.shopId,
      type: dto.type ?? ProductType.SIMPLE,
      name: dto.name,
      description: dto.description ?? null,
      landing: dto.landing ?? null,
      status: dto.status ?? ProductStatus.DRAFT,
      available: dto.available ?? true,
      sku: dto.sku ?? null,
      price: this.toNumericString(price),
      oldPrice: oldPrice === null ? null : this.toNumericString(oldPrice),
    });

    try {
      const saved = await this.productRepository.save(product);
      return this.productRepository.findById(saved.id);
    } catch (error) {
      this.rethrowConstraintError(error);
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id);

    const nextPrice =
      dto.price !== undefined ? dto.price : Number(product.price);
    const nextOldPrice =
      dto.oldPrice !== undefined
        ? dto.oldPrice
        : product.oldPrice === null
          ? null
          : Number(product.oldPrice);

    this.assertOldPriceValid(nextPrice, nextOldPrice);

    if (dto.type !== undefined) {
      product.type = dto.type;
    }
    if (dto.name !== undefined) {
      product.name = dto.name;
    }
    if (dto.description !== undefined) {
      product.description = dto.description;
    }
    if (dto.landing !== undefined) {
      product.landing = dto.landing;
    }
    if (dto.status !== undefined) {
      product.status = dto.status;
    }
    if (dto.available !== undefined) {
      product.available = dto.available;
    }
    if (dto.sku !== undefined && dto.sku !== product.sku) {
      if (dto.sku) {
        await this.ensureSkuUniqueInShop(product.shopId, dto.sku, id);
      }
      product.sku = dto.sku;
    }
    if (dto.price !== undefined) {
      product.price = this.toNumericString(dto.price);
    }
    if (dto.oldPrice !== undefined) {
      product.oldPrice =
        dto.oldPrice === null ? null : this.toNumericString(dto.oldPrice);
    }

    try {
      await this.productRepository.save(product);
      return this.productRepository.findById(id);
    } catch (error) {
      this.rethrowConstraintError(error);
    }
  }

  async removeProduct(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findById(id);
    await this.productRepository.remove(product);
    return { message: 'Product removed successfully' };
  }

  async assignCategory(
    id: string,
    dto: AssignProductCategoryDto,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    const category = await this.categoryRepository.findById(dto.categoryId);

    if (category.shopId !== product.shopId) {
      throw new BadRequestException(
        'Category belongs to a different shop than the product',
      );
    }

    const alreadyAssigned = product.categories.some(
      (item) => item.id === category.id,
    );
    if (dto.assign && !alreadyAssigned) {
      product.categories = [...product.categories, category];
      await this.productRepository.save(product);
    }
    if (!dto.assign && alreadyAssigned) {
      product.categories = product.categories.filter(
        (item) => item.id !== category.id,
      );
      await this.productRepository.save(product);
    }

    return this.productRepository.findById(id);
  }

  async assignTag(id: string, dto: AssignProductTagDto): Promise<Product> {
    const product = await this.productRepository.findById(id);
    const tag = await this.tagRepository.findById(dto.tagId);

    if (tag.shopId !== product.shopId) {
      throw new BadRequestException(
        'Tag belongs to a different shop than the product',
      );
    }

    const alreadyAssigned = product.tags.some((item) => item.id === tag.id);
    if (dto.assign && !alreadyAssigned) {
      product.tags = [...product.tags, tag];
      await this.productRepository.save(product);
    }
    if (!dto.assign && alreadyAssigned) {
      product.tags = product.tags.filter((item) => item.id !== tag.id);
      await this.productRepository.save(product);
    }

    return this.productRepository.findById(id);
  }

  async assignAttribute(
    id: string,
    dto: AssignProductAttributeDto,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    const attribute = await this.attributeRepository.findById(
      dto.attributeTypeId,
    );

    if (attribute.shopId !== product.shopId) {
      throw new BadRequestException(
        'Attribute belongs to a different shop than the product',
      );
    }

    const alreadyAssigned = product.attributes.some(
      (item) => item.id === attribute.id,
    );
    if (dto.assign && !alreadyAssigned) {
      product.attributes = [...product.attributes, attribute];
      await this.productRepository.save(product);
    }
    if (!dto.assign && alreadyAssigned) {
      product.attributes = product.attributes.filter(
        (item) => item.id !== attribute.id,
      );
      await this.productRepository.save(product);
    }

    return this.productRepository.findById(id);
  }

  async assignImages(
    id: string,
    dto: AssignProductImagesDto,
  ): Promise<Product> {
    await this.productRepository.findById(id);

    await this.productRepository.replaceImages(
      id,
      dto.images.map((image, index) => ({
        url: image.url,
        sort: image.sort ?? index,
      })),
    );

    return this.productRepository.findById(id);
  }

  private toListResponse(
    items: Product[],
    total: number,
    page: number,
    limit: number,
  ): ProductListResponse {
    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  private async ensureSkuUniqueInShop(
    shopId: string,
    sku: string,
    excludeProductId?: string,
  ): Promise<void> {
    const existing = await this.productRepository.findByShopIdAndSku(
      shopId,
      sku,
    );

    if (existing && existing.id !== excludeProductId) {
      throw new BadRequestException('Product SKU already exists for this shop');
    }
  }

  private assertOldPriceValid(price: number, oldPrice: number | null): void {
    if (oldPrice !== null && oldPrice < price) {
      throw new BadRequestException(
        'oldPrice must be greater than or equal to price',
      );
    }
  }

  private toNumericString(value: number): string {
    return value.toFixed(2);
  }

  private rethrowConstraintError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const databaseError = error as QueryFailedError & {
        code?: string;
        constraint?: string;
      };

      if (databaseError.code === '23503') {
        throw new BadRequestException('Referenced entity does not exist');
      }

      if (
        databaseError.code === '23505' &&
        databaseError.constraint === 'uq_products_shop_sku'
      ) {
        throw new BadRequestException(
          'Product SKU already exists for this shop',
        );
      }

      if (
        databaseError.code === '23514' &&
        databaseError.constraint?.includes('old_price')
      ) {
        throw new BadRequestException(
          'oldPrice must be greater than or equal to price',
        );
      }

      if (databaseError.code === '23514') {
        throw new BadRequestException('Product data violates a database check');
      }
    }

    throw error;
  }
}
