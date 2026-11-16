import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import {
  CATALOG_CACHE_SEGMENTS,
  CATALOG_PRODUCT_CACHE_TTL_SECONDS,
} from '../../../constants/catalog-cache.constants';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { Product } from '../../../entities/product.entity';
import { RelatedProductRepository } from '../../../repositories/related-product/related-product.repository';

@Injectable()
export class RelatedProductsClientService {
  constructor(
    private readonly relatedProductRepository: RelatedProductRepository,
    private readonly cacheService: CacheService,
  ) {}

  async listRelatedProducts(
    productId: string,
    shopId: string,
  ): Promise<Product[]> {
    // Like the product page, the ownership check runs inside the cached
    // section: only a matching pair is ever stored, so a foreign or draft
    // product still hits the database and still 404s.
    return this.cacheService.wrap(
      {
        scope: shopId,
        segments: [CATALOG_CACHE_SEGMENTS.RELATED, productId],
        ttlSeconds: CATALOG_PRODUCT_CACHE_TTL_SECONDS,
      },
      async () => {
        const exists = await this.relatedProductRepository.existsActiveProduct(
          shopId,
          productId,
        );

        if (!exists) {
          throw new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND);
        }

        return this.relatedProductRepository.findRelatedProducts(
          productId,
          ProductStatus.ACTIVE,
        );
      },
    );
  }
}
