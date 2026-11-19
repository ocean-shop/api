import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../../../../core/cache/cache.service';
import {
  CATALOG_CACHE_SEGMENTS,
  CATALOG_PRODUCT_CACHE_TTL_SECONDS,
} from '../../../constants/catalog-cache.constants';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { RelatedProductRepository } from '../../../repositories/related-product/related-product.repository';
import { RelatedProductsClientService } from './related-products-client.service';

const PRODUCT_ID = 'product-1';
const SHOP_ID = 'shop-1';

describe('RelatedProductsClientService', () => {
  let service: RelatedProductsClientService;
  let relatedProductRepository: {
    existsActiveProduct: jest.Mock;
    findRelatedProducts: jest.Mock;
  };
  let cacheService: { wrap: jest.Mock };

  beforeEach(async () => {
    relatedProductRepository = {
      existsActiveProduct: jest.fn(),
      findRelatedProducts: jest.fn(),
    };
    cacheService = {
      wrap: jest.fn((_descriptor: unknown, load: () => Promise<unknown>) =>
        load(),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatedProductsClientService,
        {
          provide: RelatedProductRepository,
          useValue: relatedProductRepository,
        },
        { provide: CacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<RelatedProductsClientService>(
      RelatedProductsClientService,
    );
  });

  it('should return the active related products through the cache', async () => {
    const products = [{ id: 'p-2' }];
    relatedProductRepository.existsActiveProduct.mockResolvedValue(true);
    relatedProductRepository.findRelatedProducts.mockResolvedValue(products);

    const result = await service.listRelatedProducts(PRODUCT_ID, SHOP_ID);

    expect(cacheService.wrap).toHaveBeenCalledWith(
      {
        scope: SHOP_ID,
        segments: [CATALOG_CACHE_SEGMENTS.RELATED, PRODUCT_ID],
        ttlSeconds: CATALOG_PRODUCT_CACHE_TTL_SECONDS,
      },
      expect.any(Function),
    );
    expect(relatedProductRepository.existsActiveProduct).toHaveBeenCalledWith(
      SHOP_ID,
      PRODUCT_ID,
    );
    expect(relatedProductRepository.findRelatedProducts).toHaveBeenCalledWith(
      PRODUCT_ID,
      ProductStatus.ACTIVE,
    );
    expect(result).toBe(products);
  });

  it('should throw NotFoundException when the product is not active in the shop', async () => {
    relatedProductRepository.existsActiveProduct.mockResolvedValue(false);

    await expect(
      service.listRelatedProducts(PRODUCT_ID, SHOP_ID),
    ).rejects.toThrow(new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND));
    expect(relatedProductRepository.findRelatedProducts).not.toHaveBeenCalled();
  });
});
