import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { OrderStatus } from '../../../../orders/entities/enums/order.enum';
import { OrderProduct } from '../../../../orders/entities/order-product.entity';
import { PRODUCT_REVIEW_CLIENT_SELECT } from '../../../constants/product-review.constants';
import { ProductStatus } from '../../../entities/enums/product.enum';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { Product } from '../../../entities/product.entity';
import { ProductReviewClientRepository } from './product-review-client.repository';

describe('ProductReviewClientRepository', () => {
  let repository: ProductReviewClientRepository;
  let reviewRepository: any;
  let productRepository: any;
  let orderProductRepository: any;

  beforeEach(async () => {
    reviewRepository = {
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    productRepository = { exists: jest.fn() };
    orderProductRepository = { exists: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewClientRepository,
        {
          provide: getRepositoryToken(ProductReview),
          useValue: reviewRepository,
        },
        { provide: getRepositoryToken(Product), useValue: productRepository },
        {
          provide: getRepositoryToken(OrderProduct),
          useValue: orderProductRepository,
        },
      ],
    }).compile();

    repository = module.get<ProductReviewClientRepository>(
      ProductReviewClientRepository,
    );
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

  describe('hasPurchasedProduct', () => {
    it('should look for a completed order of the user with the product', async () => {
      orderProductRepository.exists.mockResolvedValue(false);

      const result = await repository.hasPurchasedProduct(
        'user-1',
        'shop-1',
        'product-1',
      );

      expect(orderProductRepository.exists).toHaveBeenCalledWith({
        where: {
          productId: 'product-1',
          order: {
            userId: 'user-1',
            shopId: 'shop-1',
            status: In([OrderStatus.SHIPPED]),
          },
        },
      });
      expect(result).toBe(false);
    });
  });

  describe('findApprovedByProductPaginated', () => {
    it('should page approved reviews of the product in the shop newest first', async () => {
      const review = { id: 'review-1' } as ProductReview;
      reviewRepository.findAndCount.mockResolvedValue([[review], 1]);

      const result = await repository.findApprovedByProductPaginated(
        'shop-1',
        'product-1',
        20,
        10,
      );

      expect(reviewRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          shopId: 'shop-1',
          productId: 'product-1',
          status: ProductReviewStatus.APPROVED,
        },
        select: PRODUCT_REVIEW_CLIENT_SELECT,
        order: { createdAt: 'DESC', id: 'DESC' },
        skip: 20,
        take: 10,
      });
      expect(result).toEqual({ items: [review], total: 1 });
    });
  });

  describe('create', () => {
    it('should build a review entity', () => {
      const payload = { name: 'Олена' };
      const entity = { ...payload } as ProductReview;
      reviewRepository.create.mockReturnValue(entity);

      const result = repository.create(payload);

      expect(reviewRepository.create).toHaveBeenCalledWith(payload);
      expect(result).toBe(entity);
    });
  });

  describe('save', () => {
    it('should persist a review', async () => {
      const review = { name: 'Олена' } as ProductReview;
      const saved = { id: 'review-1', ...review };
      reviewRepository.save.mockResolvedValue(saved);

      const result = await repository.save(review);

      expect(reviewRepository.save).toHaveBeenCalledWith(review);
      expect(result).toBe(saved);
    });
  });
});
