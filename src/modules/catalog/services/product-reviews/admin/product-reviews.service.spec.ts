import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewRepository } from '../../../repositories/product-review/admin/product-review.repository';
import { ProductReviewsService } from './product-reviews.service';

describe('ProductReviewsService', () => {
  let service: ProductReviewsService;
  let productReviewRepository: ProductReviewRepository;

  beforeEach(async () => {
    const productReviewRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

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

  describe('updateProductReviewStatus', () => {
    it('should change the status and save the review', async () => {
      const review = {
        id: 'review-1',
        status: ProductReviewStatus.PENDING,
      } as ProductReview;
      const saved = {
        ...review,
        status: ProductReviewStatus.APPROVED,
      } as ProductReview;
      jest.mocked(productReviewRepository.findById).mockResolvedValue(review);
      jest.mocked(productReviewRepository.save).mockResolvedValue(saved);

      const result = await service.updateProductReviewStatus('review-1', {
        status: ProductReviewStatus.APPROVED,
      });

      expect(productReviewRepository.findById).toHaveBeenCalledWith('review-1');
      expect(productReviewRepository.save).toHaveBeenCalledWith({
        id: 'review-1',
        status: ProductReviewStatus.APPROVED,
      });
      expect(result).toBe(saved);
    });

    it('should return the review unchanged when the status is the same', async () => {
      const review = {
        id: 'review-1',
        status: ProductReviewStatus.REJECTED,
      } as ProductReview;
      jest.mocked(productReviewRepository.findById).mockResolvedValue(review);

      const result = await service.updateProductReviewStatus('review-1', {
        status: ProductReviewStatus.REJECTED,
      });

      expect(productReviewRepository.save).not.toHaveBeenCalled();
      expect(result).toBe(review);
    });

    it('should propagate NotFoundException from the repository', async () => {
      jest
        .mocked(productReviewRepository.findById)
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.updateProductReviewStatus('missing', {
          status: ProductReviewStatus.APPROVED,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(productReviewRepository.save).not.toHaveBeenCalled();
    });
  });
});
