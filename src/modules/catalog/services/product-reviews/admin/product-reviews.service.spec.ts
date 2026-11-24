import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewRepository } from '../../../repositories/product-review/admin/product-review.repository';
import { ProductReviewsService } from './product-reviews.service';

describe('ProductReviewsService', () => {
  let service: ProductReviewsService;
  let productReviewRepository: ProductReviewRepository;

  beforeEach(async () => {
    const productReviewRepositoryMock = { findAllPaginated: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewsService,
        {
          provide: ProductReviewRepository,
          useValue: productReviewRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProductReviewsService>(ProductReviewsService);
    productReviewRepository = module.get<ProductReviewRepository>(
      ProductReviewRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listProductReviews', () => {
    it('should list reviews of a shop with only the shop filter', async () => {
      const review = { id: 'review-1' } as ProductReview;
      jest
        .mocked(productReviewRepository.findAllPaginated)
        .mockResolvedValue({ items: [review], total: 1 });

      const result = await service.listProductReviews({
        shopId: 'shop-1',
        page: 1,
        limit: 20,
      });

      expect(productReviewRepository.findAllPaginated).toHaveBeenCalledWith(
        { shopId: 'shop-1' },
        0,
        20,
      );
      expect(result).toEqual({
        items: [review],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should pass every present filter to the repository', async () => {
      jest
        .mocked(productReviewRepository.findAllPaginated)
        .mockResolvedValue({ items: [], total: 0 });

      await service.listProductReviews({
        shopId: 'shop-1',
        productId: 'product-1',
        status: ProductReviewStatus.PENDING,
        rating: 5,
        sortOrder: 'asc',
        page: 2,
        limit: 10,
      });

      expect(productReviewRepository.findAllPaginated).toHaveBeenCalledWith(
        {
          shopId: 'shop-1',
          productId: 'product-1',
          status: ProductReviewStatus.PENDING,
          rating: 5,
          sortOrder: 'asc',
        },
        10,
        10,
      );
    });
  });
});
