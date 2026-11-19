import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import { POSTGRES_ERROR_CODES } from '../../../../../core/db/constants/postgres-error.constants';
import { matchesQueryFailedError } from '../../../../../core/db/helpers/query-failed-error/query-failed-error.helpers';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import {
  RELATED_PRODUCT_CONSTRAINTS,
  RELATED_PRODUCT_FK_CONSTRAINTS,
} from '../../../constants/related-product-constraint.constants';
import { RELATED_PRODUCT_MESSAGES } from '../../../constants/related-product-messages.constants';
import { AssignRelatedProductsDto } from '../../../dto/products/assign-related-products.dto';
import { Product } from '../../../entities/product.entity';
import { ProductRepository } from '../../../repositories/product/admin/product.repository';
import { RelatedProductRepository } from '../../../repositories/related-product/related-product.repository';

@Injectable()
export class RelatedProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly relatedProductRepository: RelatedProductRepository,
    private readonly cacheService: CacheService,
  ) {}

  /** Every related product regardless of status: the admin edits drafts too. */
  async listRelatedProducts(productId: string): Promise<Product[]> {
    await this.findProduct(productId);

    return this.relatedProductRepository.findRelatedProducts(productId);
  }

  async assignRelatedProducts(
    productId: string,
    dto: AssignRelatedProductsDto,
  ): Promise<Product[]> {
    const product = await this.findProduct(productId);

    if (dto.productIds.includes(productId)) {
      throw new BadRequestException(RELATED_PRODUCT_MESSAGES.SELF_RELATION);
    }

    await this.ensureProductsInShop(product.shopId, dto.productIds);

    try {
      await this.relatedProductRepository.replace(
        productId,
        product.shopId,
        dto.productIds,
      );
    } catch (error) {
      this.rethrowConstraintError(error);
    }

    await this.cacheService.invalidate(product.shopId);

    return this.relatedProductRepository.findRelatedProducts(productId);
  }

  private async findProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findOneById(productId);

    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND);
    }

    return product;
  }

  private async ensureProductsInShop(
    shopId: string,
    productIds: string[],
  ): Promise<void> {
    const existingIds =
      await this.relatedProductRepository.findExistingIdsInShop(
        shopId,
        productIds,
      );

    // The DTO rejects duplicates, so a shorter result means a missing product
    // or one of another shop.
    if (existingIds.length !== productIds.length) {
      throw new BadRequestException(RELATED_PRODUCT_MESSAGES.NOT_FOUND_IN_SHOP);
    }
  }

  /** Covers a product deleted between the validation and the insert. */
  private rethrowConstraintError(error: unknown): never {
    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION,
        constraintIn: RELATED_PRODUCT_FK_CONSTRAINTS,
      })
    ) {
      throw new BadRequestException(RELATED_PRODUCT_MESSAGES.NOT_FOUND_IN_SHOP);
    }

    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.CHECK_VIOLATION,
        constraint: RELATED_PRODUCT_CONSTRAINTS.NOT_SELF,
      })
    ) {
      throw new BadRequestException(RELATED_PRODUCT_MESSAGES.SELF_RELATION);
    }

    throw error;
  }
}
