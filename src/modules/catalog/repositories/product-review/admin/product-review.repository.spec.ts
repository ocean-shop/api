import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PRODUCT_REVIEW_MESSAGES } from '../../../constants/product-review-messages.constants';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewRepository } from './product-review.repository';

describe('ProductReviewRepository', () => {
  let repository: ProductReviewRepository;
  let queryBuilder: any;
  let typeOrmRepository: any;

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewRepository,
        {
          provide: getRepositoryToken(ProductReview),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ProductReviewRepository>(ProductReviewRepository);
  });

  describe('findAllPaginated', () => {
    it('should page the reviews of a shop newest first with product fields', async () => {
      const review = { id: 'review-1' } as ProductReview;
      queryBuilder.getManyAndCount.mockResolvedValue([[review], 1]);

      const result = await repository.findAllPaginated(
        { shopId: 'shop-1' },
        0,
        20,
      );

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'review',
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'review.product',
        'product',
      );
      expect(queryBuilder.addSelect).toHaveBeenCalledWith([
        'product.id',
        'product.name',
        'product.slug',
      ]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'review.shopId = :shopId',
        { shopId: 'shop-1' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'review.createdAt',
        'DESC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('review.id', 'DESC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual({ items: [review], total: 1 });
    });

    it('should apply every present filter and ascending order', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findAllPaginated(
        {
          shopId: 'shop-1',
          productId: 'product-1',
          status: ProductReviewStatus.APPROVED,
          rating: 4,
          sortOrder: 'asc',
        },
        20,
        10,
      );

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'review.createdAt',
        'ASC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('review.id', 'ASC');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'review.productId = :productId',
        { productId: 'product-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'review.status = :status',
        { status: ProductReviewStatus.APPROVED },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'review.rating = :rating',
        { rating: 4 },
      );
    });
  });

  describe('findById', () => {
    it('should return the review', async () => {
      const review = { id: 'review-1' } as ProductReview;
      typeOrmRepository.findOne.mockResolvedValue(review);

      const result = await repository.findById('review-1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(result).toBe(review);
    });

    it('should throw NotFoundException when the review is missing', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.findById('missing')).rejects.toThrow(
        new NotFoundException(PRODUCT_REVIEW_MESSAGES.NOT_FOUND),
      );
    });
  });

  describe('save', () => {
    it('should save the review', async () => {
      const review = { id: 'review-1' } as ProductReview;
      typeOrmRepository.save.mockResolvedValue(review);

      const result = await repository.save(review);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(review);
      expect(result).toBe(review);
    });
  });
});
