import { BadRequestException, Injectable } from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import { POSTGRES_ERROR_CODES } from '../../../../../core/db/constants/postgres-error.constants';
import { matchesQueryFailedError } from '../../../../../core/db/helpers/query-failed-error/query-failed-error.helpers';
import { ATTRIBUTE_MESSAGES } from '../../../constants/attribute-messages.constants';
import { CATEGORY_MESSAGES } from '../../../constants/category-messages.constants';
import { PRODUCT_CONSTRAINTS } from '../../../constants/product-constraint.constants';
import { IMAGE_DATA_URI_PREFIX } from '../../../constants/product-image.constants';
import {
  PRODUCT_MESSAGES,
  PRODUCT_VARIATION_MESSAGES,
} from '../../../constants/product-messages.constants';
import { PRICE_DECIMALS } from '../../../constants/price.constants';
import { TAG_MESSAGES } from '../../../constants/tag-messages.constants';
import { AssignProductAttributeDto } from '../../../dto/attributes/assign-product-attribute.dto';
import { AssignProductCategoryDto } from '../../../dto/products/assign-product-category.dto';
import { AssignProductImagesDto } from '../../../dto/products/assign-product-images.dto';
import { AssignProductTagDto } from '../../../dto/products/assign-product-tag.dto';
import { ProductVariationDto } from '../../../dto/products/product-variation.dto';
import { CreateProductDto } from '../../../dto/products/create-product.dto';
import { ListProductsQueryDto } from '../../../dto/products/list-products-query.dto';
import { UpdateProductDto } from '../../../dto/products/update-product.dto';
import {
  ProductStatus,
  ProductType,
} from '../../../entities/enums/product.enum';
import { ProductVariation } from '../../../entities/product-variation.entity';
import { Product } from '../../../entities/product.entity';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response/list-response.helpers';
import { slugify, withSlugSuffix } from '../../../helpers/slug/slug.helpers';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { ImagePayload } from '../../../models/product-image.models';
import {
  ProductListResponse,
  ProductRelationAssignment,
  ShopOwnedEntity,
} from '../../../models/product.models';
import { AttributeRepository } from '../../../repositories/attribute/attribute.repository';
import { CategoryRepository } from '../../../repositories/category/admin/category.repository';
import { ProductRepository } from '../../../repositories/product/admin/product.repository';
import { ProductVariationRepository } from '../../../repositories/product-variation/product-variation.repository';
import { ShopRepository } from '../../../repositories/shop/shop.repository';
import { TagRepository } from '../../../repositories/tag/tag.repository';
import { ProductImagesCloudinaryService } from '../../cloudinary/product-images-cloudinary.service';

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
    private readonly cacheService: CacheService,
  ) {}

  async listProducts(
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } = await this.productRepository.findAllPaginated(
      {
        shopId: query.shopId,
        status: query.status,
        name: query.name,
        sku: query.sku,
        categoryIds: query.categoryIds,
        isPopular: query.isPopular,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      skip,
      limit,
    );

    return toListResponse(items, total, page, limit);
  }

  async listProductsByCategoryId(
    categoryId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.categoryRepository.findById(categoryId);
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } =
      await this.productRepository.findByCategoryIdPaginated(
        categoryId,
        skip,
        limit,
        query.sortBy,
        query.sortOrder,
        query.isPopular,
      );

    return toListResponse(items, total, page, limit);
  }

  async listProductsByTagId(
    tagId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.tagRepository.findById(tagId);
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } = await this.productRepository.findByTagIdPaginated(
      tagId,
      skip,
      limit,
      query.sortBy,
      query.sortOrder,
    );

    return toListResponse(items, total, page, limit);
  }

  async listProductsByAttributeTypeId(
    attributeTypeId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductListResponse> {
    await this.attributeRepository.findById(attributeTypeId);
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } =
      await this.productRepository.findByAttributeTypeIdPaginated(
        attributeTypeId,
        skip,
        limit,
        query.sortBy,
        query.sortOrder,
      );

    return toListResponse(items, total, page, limit);
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

    const slug = dto.slug
      ? await this.ensureSlugUniqueInShop(dto.shopId, dto.slug)
      : await this.generateUniqueSlug(dto.shopId, dto.name);

    const product = this.productRepository.create({
      shopId: dto.shopId,
      type: dto.type ?? ProductType.SIMPLE,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      landing: dto.landing ?? null,
      status: dto.status ?? ProductStatus.DRAFT,
      available: dto.available ?? true,
      isPopular: dto.isPopular ?? false,
      isMainBanner: dto.isMainBanner ?? false,
      sku: dto.sku ?? null,
      price: this.toNumericString(price),
      oldPrice: oldPrice === null ? null : this.toNumericString(oldPrice),
      metaTitle: dto.metaTitle ?? null,
      metaDescription: dto.metaDescription ?? null,
      canonicalUrl: dto.canonicalUrl ?? null,
      noIndex: dto.noIndex ?? false,
    });

    try {
      const saved = await this.productRepository.save(product);
      await this.cacheService.invalidate(dto.shopId);
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
    // A rename leaves the slug alone on purpose: changing it would break every
    // link and search result that already points at the product.
    if (dto.slug !== undefined && dto.slug !== product.slug) {
      product.slug = await this.ensureSlugUniqueInShop(
        product.shopId,
        dto.slug,
        id,
      );
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
    if (dto.isPopular !== undefined) {
      product.isPopular = dto.isPopular;
    }
    if (dto.isMainBanner !== undefined) {
      product.isMainBanner = dto.isMainBanner;
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
    if (dto.metaTitle !== undefined) {
      product.metaTitle = dto.metaTitle;
    }
    if (dto.metaDescription !== undefined) {
      product.metaDescription = dto.metaDescription;
    }
    if (dto.canonicalUrl !== undefined) {
      product.canonicalUrl = dto.canonicalUrl;
    }
    if (dto.noIndex !== undefined) {
      product.noIndex = dto.noIndex;
    }

    try {
      await this.productRepository.save(product);
      await this.cacheService.invalidate(product.shopId);
      return this.productRepository.findById(id);
    } catch (error) {
      this.rethrowConstraintError(error);
    }
  }

  async removeProduct(id: string): Promise<MessageResponse> {
    const product = await this.productRepository.findById(id);
    await this.productRepository.remove(product);
    await this.cacheService.invalidate(product.shopId);
    return { message: PRODUCT_MESSAGES.REMOVED };
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
      crossShopMessage: CATEGORY_MESSAGES.OTHER_SHOP,
    });
  }

  async assignTag(id: string, dto: AssignProductTagDto): Promise<Product> {
    const tag = await this.tagRepository.findById(dto.tagId);
    return this.assignProductRelation({
      productId: id,
      relationName: 'tags',
      relationEntity: tag,
      assign: dto.assign,
      crossShopMessage: TAG_MESSAGES.OTHER_SHOP,
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
      crossShopMessage: ATTRIBUTE_MESSAGES.OTHER_SHOP,
    });
  }

  async assignImages(
    id: string,
    dto: AssignProductImagesDto,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);

    const uploadedImages = await Promise.all(
      dto.images.map(async (image, index) => ({
        url: await this.resolveImageUrl(image.image),
        alt: image.alt ?? null,
        sort: image.sort ?? index,
      })),
    );

    await this.productRepository.replaceImages(id, uploadedImages);
    await this.cacheService.invalidate(product.shopId);

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

  private async assignProductRelation({
    productId,
    relationName,
    relationEntity,
    assign,
    crossShopMessage,
  }: ProductRelationAssignment): Promise<Product> {
    const product = await this.productRepository.findById(productId);

    if (relationEntity.shopId !== product.shopId) {
      throw new BadRequestException(crossShopMessage);
    }

    const currentRelations =
      (product[relationName] as ShopOwnedEntity[] | undefined) ?? [];
    const alreadyAssigned = currentRelations.some(
      (item) => item.id === relationEntity.id,
    );

    if (assign && !alreadyAssigned) {
      product[relationName] = [...currentRelations, relationEntity] as never;
      await this.productRepository.save(product);
      await this.cacheService.invalidate(product.shopId);
    }

    if (!assign && alreadyAssigned) {
      product[relationName] = currentRelations.filter(
        (item) => item.id !== relationEntity.id,
      ) as never;
      await this.productRepository.save(product);
      await this.cacheService.invalidate(product.shopId);
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
      throw new BadRequestException(PRODUCT_MESSAGES.DUPLICATE_SKU);
    }
  }

  /** Returns the slug so callers can assign it straight after the check. */
  private async ensureSlugUniqueInShop(
    shopId: string,
    slug: string,
    excludeProductId?: string,
  ): Promise<string> {
    const existing = await this.productRepository.findByShopIdAndSlug(
      shopId,
      slug,
    );

    if (existing && existing.id !== excludeProductId) {
      throw new BadRequestException(PRODUCT_MESSAGES.DUPLICATE_SLUG);
    }

    return slug;
  }

  /** Slug of the name, suffixed with `-2`, `-3`, … until no product holds it. */
  private async generateUniqueSlug(
    shopId: string,
    name: string,
  ): Promise<string> {
    const base = slugify(name);

    for (let attempt = 1; ; attempt += 1) {
      const candidate = withSlugSuffix(base, attempt);
      const existing = await this.productRepository.findByShopIdAndSlug(
        shopId,
        candidate,
      );

      if (!existing) {
        return candidate;
      }
    }
  }

  private assertOldPriceValid(price: number, oldPrice: number | null): void {
    if (oldPrice !== null && oldPrice < price) {
      throw new BadRequestException(PRODUCT_MESSAGES.INVALID_OLD_PRICE);
    }
  }

  private toNumericString(value: number): string {
    return value.toFixed(PRICE_DECIMALS);
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
          throw new BadRequestException(ATTRIBUTE_MESSAGES.OTHER_SHOP);
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

      // Variation prices feed the catalog's effective price, so they change
      // both filtering and sorting of the cached pages.
      await this.cacheService.invalidate(product.shopId);

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
      throw new BadRequestException(PRODUCT_VARIATION_MESSAGES.OTHER_PRODUCT);
    }

    return variation;
  }

  private async resolveUploadedImages(
    dto: ProductVariationDto,
  ): Promise<ImagePayload[]> {
    return Promise.all(
      dto.images.map(async (image, index) => ({
        url: await this.resolveImageUrl(image.image),
        alt: image.alt ?? null,
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
    uploadedImages: ImagePayload[],
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
    if (!image.startsWith(IMAGE_DATA_URI_PREFIX)) {
      return image;
    }

    return this.productImagesCloudinaryService.uploadBase64Image(image);
  }

  private rethrowConstraintError(error: unknown): never {
    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION,
      })
    ) {
      throw new BadRequestException(PRODUCT_MESSAGES.RELATED_ENTITY_NOT_FOUND);
    }

    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION,
        constraint: PRODUCT_CONSTRAINTS.UNIQUE_SKU,
      })
    ) {
      throw new BadRequestException(PRODUCT_MESSAGES.DUPLICATE_SKU);
    }

    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION,
        constraint: PRODUCT_CONSTRAINTS.UNIQUE_SLUG,
      })
    ) {
      throw new BadRequestException(PRODUCT_MESSAGES.DUPLICATE_SLUG);
    }

    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION,
        constraint: PRODUCT_CONSTRAINTS.UNIQUE_VARIATION_ATTRIBUTE,
      })
    ) {
      throw new BadRequestException(
        PRODUCT_VARIATION_MESSAGES.DUPLICATE_ATTRIBUTE,
      );
    }

    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.CHECK_VIOLATION,
        constraintIncludes: PRODUCT_CONSTRAINTS.OLD_PRICE_CHECK_FRAGMENT,
      })
    ) {
      throw new BadRequestException(PRODUCT_MESSAGES.INVALID_OLD_PRICE);
    }

    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.CHECK_VIOLATION,
      })
    ) {
      throw new BadRequestException(PRODUCT_MESSAGES.CONSTRAINT_VIOLATION);
    }

    throw error;
  }
}
