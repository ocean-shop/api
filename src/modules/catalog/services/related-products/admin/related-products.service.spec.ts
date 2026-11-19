import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { CacheService } from '../../../../../core/cache/cache.service';
import { POSTGRES_ERROR_CODES } from '../../../../../core/db/constants/postgres-error.constants';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import { RELATED_PRODUCT_CONSTRAINTS } from '../../../constants/related-product-constraint.constants';
import { RELATED_PRODUCT_MESSAGES } from '../../../constants/related-product-messages.constants';
import { ProductRepository } from '../../../repositories/product/admin/product.repository';
import { RelatedProductRepository } from '../../../repositories/related-product/related-product.repository';
import { RelatedProductsService } from './related-products.service';

const PRODUCT_ID = 'product-1';
const SHOP_ID = 'shop-1';

const queryFailedError = (code: string, constraint: string): Error =>
  Object.assign(new QueryFailedError('INSERT', [], new Error('db')), {
    code,
    constraint,
  });

describe('RelatedProductsService', () => {
  let service: RelatedProductsService;
  let productRepository: { findOneById: jest.Mock };
  let relatedProductRepository: {
    findExistingIdsInShop: jest.Mock;
    replace: jest.Mock;
    findRelatedProducts: jest.Mock;
  };
  let cacheService: { invalidate: jest.Mock };

  beforeEach(async () => {
    productRepository = { findOneById: jest.fn() };
    relatedProductRepository = {
      findExistingIdsInShop: jest.fn(),
      replace: jest.fn(),
      findRelatedProducts: jest.fn(),
    };
    cacheService = { invalidate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatedProductsService,
        { provide: ProductRepository, useValue: productRepository },
        {
          provide: RelatedProductRepository,
          useValue: relatedProductRepository,
        },
        { provide: CacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<RelatedProductsService>(RelatedProductsService);
  });

  describe('listRelatedProducts', () => {
    it('should return every related product of the product', async () => {
      const products = [{ id: 'p-2' }];
      productRepository.findOneById.mockResolvedValue({
        id: PRODUCT_ID,
        shopId: SHOP_ID,
      });
      relatedProductRepository.findRelatedProducts.mockResolvedValue(products);

      const result = await service.listRelatedProducts(PRODUCT_ID);

      expect(productRepository.findOneById).toHaveBeenCalledWith(PRODUCT_ID);
      expect(relatedProductRepository.findRelatedProducts).toHaveBeenCalledWith(
        PRODUCT_ID,
      );
      expect(result).toBe(products);
    });

    it('should throw NotFoundException for a missing product', async () => {
      productRepository.findOneById.mockResolvedValue(null);

      await expect(service.listRelatedProducts(PRODUCT_ID)).rejects.toThrow(
        new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND),
      );
      expect(
        relatedProductRepository.findRelatedProducts,
      ).not.toHaveBeenCalled();
    });
  });

  describe('assignRelatedProducts', () => {
    const dto = { productIds: ['p-2', 'p-3'] };

    beforeEach(() => {
      productRepository.findOneById.mockResolvedValue({
        id: PRODUCT_ID,
        shopId: SHOP_ID,
      });
    });

    it('should replace the list, invalidate the cache and return the new list', async () => {
      const products = [{ id: 'p-2' }, { id: 'p-3' }];
      relatedProductRepository.findExistingIdsInShop.mockResolvedValue([
        'p-3',
        'p-2',
      ]);
      relatedProductRepository.findRelatedProducts.mockResolvedValue(products);

      const result = await service.assignRelatedProducts(PRODUCT_ID, dto);

      expect(
        relatedProductRepository.findExistingIdsInShop,
      ).toHaveBeenCalledWith(SHOP_ID, dto.productIds);
      expect(relatedProductRepository.replace).toHaveBeenCalledWith(
        PRODUCT_ID,
        SHOP_ID,
        dto.productIds,
      );
      expect(cacheService.invalidate).toHaveBeenCalledWith(SHOP_ID);
      expect(result).toBe(products);
    });

    it('should clear the list for an empty array', async () => {
      relatedProductRepository.findExistingIdsInShop.mockResolvedValue([]);
      relatedProductRepository.findRelatedProducts.mockResolvedValue([]);

      const result = await service.assignRelatedProducts(PRODUCT_ID, {
        productIds: [],
      });

      expect(relatedProductRepository.replace).toHaveBeenCalledWith(
        PRODUCT_ID,
        SHOP_ID,
        [],
      );
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException for a missing product', async () => {
      productRepository.findOneById.mockResolvedValue(null);

      await expect(
        service.assignRelatedProducts(PRODUCT_ID, dto),
      ).rejects.toThrow(NotFoundException);
      expect(relatedProductRepository.replace).not.toHaveBeenCalled();
    });

    it('should reject the product itself in the list', async () => {
      await expect(
        service.assignRelatedProducts(PRODUCT_ID, {
          productIds: ['p-2', PRODUCT_ID],
        }),
      ).rejects.toThrow(
        new BadRequestException(RELATED_PRODUCT_MESSAGES.SELF_RELATION),
      );
      expect(
        relatedProductRepository.findExistingIdsInShop,
      ).not.toHaveBeenCalled();
    });

    it('should reject products missing from the shop', async () => {
      relatedProductRepository.findExistingIdsInShop.mockResolvedValue(['p-2']);

      await expect(
        service.assignRelatedProducts(PRODUCT_ID, dto),
      ).rejects.toThrow(
        new BadRequestException(RELATED_PRODUCT_MESSAGES.NOT_FOUND_IN_SHOP),
      );
      expect(relatedProductRepository.replace).not.toHaveBeenCalled();
      expect(cacheService.invalidate).not.toHaveBeenCalled();
    });

    it.each([
      RELATED_PRODUCT_CONSTRAINTS.PRODUCT_FK,
      RELATED_PRODUCT_CONSTRAINTS.RELATED_PRODUCT_FK,
    ])(
      'should map the %s foreign key violation to BadRequestException',
      async (constraint) => {
        relatedProductRepository.findExistingIdsInShop.mockResolvedValue(
          dto.productIds,
        );
        relatedProductRepository.replace.mockRejectedValue(
          queryFailedError(
            POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION,
            constraint,
          ),
        );

        await expect(
          service.assignRelatedProducts(PRODUCT_ID, dto),
        ).rejects.toThrow(
          new BadRequestException(RELATED_PRODUCT_MESSAGES.NOT_FOUND_IN_SHOP),
        );
        expect(cacheService.invalidate).not.toHaveBeenCalled();
      },
    );

    it('should map the self-relation check violation to BadRequestException', async () => {
      relatedProductRepository.findExistingIdsInShop.mockResolvedValue(
        dto.productIds,
      );
      relatedProductRepository.replace.mockRejectedValue(
        queryFailedError(
          POSTGRES_ERROR_CODES.CHECK_VIOLATION,
          RELATED_PRODUCT_CONSTRAINTS.NOT_SELF,
        ),
      );

      await expect(
        service.assignRelatedProducts(PRODUCT_ID, dto),
      ).rejects.toThrow(
        new BadRequestException(RELATED_PRODUCT_MESSAGES.SELF_RELATION),
      );
    });

    it('should rethrow unknown errors unchanged', async () => {
      const error = new Error('boom');
      relatedProductRepository.findExistingIdsInShop.mockResolvedValue(
        dto.productIds,
      );
      relatedProductRepository.replace.mockRejectedValue(error);

      await expect(service.assignRelatedProducts(PRODUCT_ID, dto)).rejects.toBe(
        error,
      );
    });
  });
});
