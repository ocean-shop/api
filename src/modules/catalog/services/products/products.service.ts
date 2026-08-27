import { BadRequestException, Injectable } from '@nestjs/common';
import { matchesQueryFailedError } from '../../../../core/db/helpers/query-failed-error.helpers';
import { AssignProductAttributeDto } from '../../dto/attributes/assign-product-attribute.dto';
import { AssignProductCategoryDto } from '../../dto/products/assign-product-category.dto';
import { AssignProductImagesDto } from '../../dto/products/assign-product-images.dto';
import { AssignProductTagDto } from '../../dto/products/assign-product-tag.dto';
import { ProductVariationDto } from '../../dto/products/product-variation.dto';
import { CreateProductDto } from '../../dto/products/create-product.dto';
import { ListProductsQueryDto } from '../../dto/products/list-products-query.dto';
import { UpdateProductDto } from '../../dto/products/update-product.dto';
import { ProductStatus, ProductType } from '../../entities/enums/product.enum';
import { ProductVariation } from '../../entities/product-variation.entity';
import { Product } from '../../entities/product.entity';
import { ProductListResponse } from '../../models/product.models';
import { AttributeRepository } from '../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../repositories/category/category.repository';
import { ProductRepository } from '../../repositories/product/product.repository';
import { ProductVariationRepository } from '../../repositories/product-variation/product-variation.repository';
import { ShopRepository } from '../../repositories/shop/shop.repository';
import { TagRepository } from '../../repositories/tag/tag.repository';
import { PAGINATION_MAX } from '../../constants/pagination.constants';
import { ProductImagesCloudinaryService } from '../cloudinary/product-images-cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariationRepository: ProductVariationRepository,
    private readonly shopRepository: ShopRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
    private readonly attributeRepository: AttributeRepository,
    private readonly productImagesCloudinaryService: ProductImagesCloudinaryService,
  ) {}

  async listProducts(
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    const { page, limit, skip } = this.resolvePagination(query);

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
    const { page, limit, skip } = this.resolvePagination(query);

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
    const { page, limit, skip } = this.resolvePagination(query);

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
    const { page, limit, skip } = this.resolvePagination(query);

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
    return { message: 'Продукт успішно видалено' };
  }

  async assignCategory(
    id: string,
    dto: AssignProductCategoryDto,
  ): Promise<Product> {
    const category = await this.categoryRepository.findById(dto.categoryId);
    return this.assignProductRelation({
      productId: id,
      relationName: 'categories',
      relationEntity: category,
      assign: dto.assign,
      crossShopMessage: 'Категорія належить іншому магазину, ніж продукт',
    });
  }

  async assignTag(id: string, dto: AssignProductTagDto): Promise<Product> {
    const tag = await this.tagRepository.findById(dto.tagId);
    return this.assignProductRelation({
      productId: id,
      relationName: 'tags',
      relationEntity: tag,
      assign: dto.assign,
      crossShopMessage: 'Тег належить іншому магазину, ніж продукт',
    });
  }

  async assignAttribute(
    id: string,
    dto: AssignProductAttributeDto,
  ): Promise<Product> {
    const attribute = await this.attributeRepository.findById(
      dto.attributeTypeId,
    );
    return this.assignProductRelation({
      productId: id,
      relationName: 'attributes',
      relationEntity: attribute,
      assign: dto.assign,
      crossShopMessage: 'Атрибут належить іншому магазину, ніж продукт',
    });
  }

  async assignImages(
    id: string,
    dto: AssignProductImagesDto,
  ): Promise<Product> {
    await this.productRepository.findById(id);

    const uploadedImages = await Promise.all(
      dto.images.map(async (image, index) => ({
        url: await this.resolveImageUrl(image.image),
        sort: image.sort ?? index,
      })),
    );

    await this.productRepository.replaceImages(id, uploadedImages);

    return this.productRepository.findById(id);
  }

  async createVariation(
    id: string,
    dto: ProductVariationDto,
  ): Promise<Product> {
    return this.upsertVariation(id, dto);
  }

  async updateVariation(
    id: string,
    variationId: string,
    dto: ProductVariationDto,
  ): Promise<Product> {
    return this.upsertVariation(id, dto, variationId);
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

  private resolvePagination(query: ListProductsQueryDto): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_MAX;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  private async assignProductRelation<
    TEntity extends { id: string; shopId: string },
  >({
    productId,
    relationName,
    relationEntity,
    assign,
    crossShopMessage,
  }: {
    productId: string;
    relationName: 'categories' | 'tags' | 'attributes';
    relationEntity: TEntity;
    assign: boolean;
    crossShopMessage: string;
  }): Promise<Product> {
    const product = await this.productRepository.findById(productId);

    if (relationEntity.shopId !== product.shopId) {
      throw new BadRequestException(crossShopMessage);
    }

    const currentRelations =
      (product[relationName] as Array<{ id: string }> | undefined) ?? [];
    const alreadyAssigned = currentRelations.some(
      (item) => item.id === relationEntity.id,
    );

    if (assign && !alreadyAssigned) {
      product[relationName] = [...currentRelations, relationEntity] as never;
      await this.productRepository.save(product);
    }

    if (!assign && alreadyAssigned) {
      product[relationName] = currentRelations.filter(
        (item) => item.id !== relationEntity.id,
      ) as never;
      await this.productRepository.save(product);
    }

    return this.productRepository.findById(productId);
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
      throw new BadRequestException(
        'SKU продукту вже існує для цього магазину',
      );
    }
  }

  private assertOldPriceValid(price: number, oldPrice: number | null): void {
    if (oldPrice !== null && oldPrice < price) {
      throw new BadRequestException(
        'oldPrice має бути більшим або дорівнювати price',
      );
    }
  }

  private toNumericString(value: number): string {
    return value.toFixed(2);
  }

  private async ensureProductTypeVariable(product: Product): Promise<void> {
    if (product.type === ProductType.VARIABLE) {
      return;
    }

    product.type = ProductType.VARIABLE;
    await this.productRepository.save(product);
  }

  private async resolveValidatedVariationAttributes(
    productShopId: string,
    dto: ProductVariationDto,
  ): Promise<string[]> {
    return Promise.all(
      dto.attributes.map(async (attribute) => {
        const existingAttribute = await this.attributeRepository.findById(
          attribute.attributeTypeId,
        );

        if (existingAttribute.shopId !== productShopId) {
          throw new BadRequestException(
            'Атрибут належить іншому магазину, ніж продукт',
          );
        }

        return attribute.attributeTypeId;
      }),
    );
  }

  private async upsertVariation(
    productId: string,
    dto: ProductVariationDto,
    variationId?: string,
  ): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    this.assertOldPriceValid(dto.price, dto.oldPrice ?? null);

    const existingVariation = variationId
      ? await this.findVariationForProduct(productId, variationId)
      : null;
    const validatedAttributes = await this.resolveValidatedVariationAttributes(
      product.shopId,
      dto,
    );
    const uploadedImages = await this.resolveUploadedImages(dto);

    try {
      await this.ensureProductTypeVariable(product);

      const targetVariationId = existingVariation
        ? await this.updateExistingVariation(existingVariation, dto)
        : await this.createNewVariation(productId, dto);

      await this.syncVariationRelations(
        targetVariationId,
        validatedAttributes,
        uploadedImages,
      );

      return this.productRepository.findById(productId);
    } catch (error) {
      this.rethrowConstraintError(error);
    }
  }

  private async findVariationForProduct(
    productId: string,
    variationId: string,
  ): Promise<ProductVariation> {
    const variation =
      await this.productVariationRepository.findById(variationId);
    if (variation.productId !== productId) {
      throw new BadRequestException('Варіація не належить вказаному продукту');
    }

    return variation;
  }

  private async resolveUploadedImages(
    dto: ProductVariationDto,
  ): Promise<Array<{ url: string; sort: number }>> {
    return Promise.all(
      dto.images.map(async (image, index) => ({
        url: await this.resolveImageUrl(image.image),
        sort: image.sort ?? index,
      })),
    );
  }

  private buildVariationPayload(
    dto: ProductVariationDto,
  ): Pick<
    ProductVariation,
    'sku' | 'name' | 'title' | 'price' | 'oldPrice' | 'available' | 'isDefault'
  > {
    return {
      sku: dto.sku,
      name: dto.name,
      title: dto.title,
      price: this.toNumericString(dto.price),
      oldPrice:
        dto.oldPrice === null || dto.oldPrice === undefined
          ? null
          : this.toNumericString(dto.oldPrice),
      available: dto.available,
      isDefault: dto.isDefault,
    };
  }

  private async createNewVariation(
    productId: string,
    dto: ProductVariationDto,
  ): Promise<string> {
    const variation = this.productVariationRepository.create({
      productId,
      ...this.buildVariationPayload(dto),
    });
    const savedVariation =
      await this.productVariationRepository.save(variation);
    return savedVariation.id;
  }

  private async updateExistingVariation(
    variation: ProductVariation,
    dto: ProductVariationDto,
  ): Promise<string> {
    Object.assign(variation, this.buildVariationPayload(dto));
    await this.productVariationRepository.save(variation);
    return variation.id;
  }

  private async syncVariationRelations(
    variationId: string,
    validatedAttributes: string[],
    uploadedImages: Array<{ url: string; sort: number }>,
  ): Promise<void> {
    await this.productVariationRepository.replaceAttributes(
      variationId,
      validatedAttributes.map((attributeTypeId) => ({
        attributeTypeId,
      })),
    );

    await this.productVariationRepository.replaceImages(
      variationId,
      uploadedImages,
    );
  }

  private async resolveImageUrl(image: string): Promise<string> {
    if (!image.startsWith('data:image/')) {
      return image;
    }

    return this.productImagesCloudinaryService.uploadBase64Image(image);
  }

  private rethrowConstraintError(error: unknown): never {
    if (matchesQueryFailedError(error, { code: '23503' })) {
      throw new BadRequestException('Повʼязана сутність не існує');
    }

    if (
      matchesQueryFailedError(error, {
        code: '23505',
        constraint: 'uq_products_shop_sku',
      })
    ) {
      throw new BadRequestException(
        'SKU продукту вже існує для цього магазину',
      );
    }

    if (
      matchesQueryFailedError(error, {
        code: '23505',
        constraint: 'variations_attributes_pkey',
      })
    ) {
      throw new BadRequestException(
        'Дублювання призначення атрибутів варіації заборонено',
      );
    }

    if (
      matchesQueryFailedError(error, {
        code: '23514',
        constraintIncludes: 'old_price',
      })
    ) {
      throw new BadRequestException(
        'oldPrice має бути більшим або дорівнювати price',
      );
    }

    if (matchesQueryFailedError(error, { code: '23514' })) {
      throw new BadRequestException(
        'Дані продукту порушують обмеження бази даних',
      );
    }

    throw error;
  }
}
