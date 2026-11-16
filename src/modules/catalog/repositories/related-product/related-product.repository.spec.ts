import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { ProductStatus } from '../../entities/enums/product.enum';
import { ProductRelated } from '../../entities/product-related.entity';
import { Product } from '../../entities/product.entity';
import { RelatedProductRepository } from './related-product.repository';

describe('RelatedProductRepository', () => {
  let repository: RelatedProductRepository;
  let productRepository: any;
  let relatedRepository: any;
  let manager: any;
  let queryBuilder: any;

  beforeEach(async () => {
    manager = { delete: jest.fn(), insert: jest.fn() };
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    productRepository = { exists: jest.fn(), find: jest.fn() };
    relatedRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: {
        transaction: jest.fn((work: (m: any) => Promise<void>) =>
          work(manager),
        ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatedProductRepository,
        { provide: getRepositoryToken(Product), useValue: productRepository },
        {
          provide: getRepositoryToken(ProductRelated),
          useValue: relatedRepository,
        },
      ],
    }).compile();

    repository = module.get<RelatedProductRepository>(RelatedProductRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('existsActiveProduct', () => {
    it('should check that the product is active in the shop', async () => {
      productRepository.exists.mockResolvedValue(true);

      const result = await repository.existsActiveProduct(
        'shop-1',
        'product-1',
      );

      expect(productRepository.exists).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          shopId: 'shop-1',
          status: ProductStatus.ACTIVE,
        },
      });
      expect(result).toBe(true);
    });
  });

  describe('findExistingIdsInShop', () => {
    it('should return the ids of the shop products found', async () => {
      productRepository.find.mockResolvedValue([{ id: 'p-1' }]);

      const result = await repository.findExistingIdsInShop('shop-1', [
        'p-1',
        'p-2',
      ]);

      expect(productRepository.find).toHaveBeenCalledWith({
        select: { id: true },
        where: { shopId: 'shop-1', id: In(['p-1', 'p-2']) },
      });
      expect(result).toEqual(['p-1']);
    });

    it('should skip the query for an empty list', async () => {
      const result = await repository.findExistingIdsInShop('shop-1', []);

      expect(productRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('replace', () => {
    it('should delete the old list and insert the new one in order', async () => {
      await repository.replace('product-1', 'shop-1', ['p-2', 'p-3']);

      expect(relatedRepository.manager.transaction).toHaveBeenCalled();
      expect(manager.delete).toHaveBeenCalledWith(ProductRelated, {
        productId: 'product-1',
      });
      expect(manager.insert).toHaveBeenCalledWith(ProductRelated, [
        {
          productId: 'product-1',
          relatedProductId: 'p-2',
          shopId: 'shop-1',
          sortOrder: 0,
        },
        {
          productId: 'product-1',
          relatedProductId: 'p-3',
          shopId: 'shop-1',
          sortOrder: 1,
        },
      ]);
    });

    it('should only clear the list when it is empty', async () => {
      await repository.replace('product-1', 'shop-1', []);

      expect(manager.delete).toHaveBeenCalled();
      expect(manager.insert).not.toHaveBeenCalled();
    });
  });

  describe('findRelatedProducts', () => {
    it('should load the related products in display order', async () => {
      const products = [{ id: 'p-3' }, { id: 'p-2' }];
      queryBuilder.getRawMany.mockResolvedValue([{ id: 'p-3' }, { id: 'p-2' }]);
      const loadInOrder = jest
        .spyOn(repository as any, 'findProductsWithRelationsInOrder')
        .mockResolvedValue(products);

      const result = await repository.findRelatedProducts('product-1');

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'related.relatedProduct',
        'product',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'related.productId = :productId',
        { productId: 'product-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'related.sortOrder',
        'ASC',
      );
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(loadInOrder).toHaveBeenCalledWith(['p-3', 'p-2']);
      expect(result).toBe(products);
    });

    it('should filter by status when given', async () => {
      queryBuilder.getRawMany.mockResolvedValue([{ id: 'p-2' }]);
      jest
        .spyOn(repository as any, 'findProductsWithRelationsInOrder')
        .mockResolvedValue([]);

      await repository.findRelatedProducts('product-1', ProductStatus.ACTIVE);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'product.status = :status',
        { status: ProductStatus.ACTIVE },
      );
    });

    it('should not load relations when there are no related products', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);
      const loadInOrder = jest.spyOn(
        repository as any,
        'findProductsWithRelationsInOrder',
      );

      const result = await repository.findRelatedProducts('product-1');

      expect(loadInOrder).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
