import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PRODUCT_REVIEW_MESSAGES } from '../../../constants/product-review-messages.constants';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewClientRepository } from '../../../repositories/product-review/client/product-review-client.repository';
import { ProductReviewsClientService } from './product-reviews-client.service';

describe('ProductReviewsClientService', () => {
  let service: ProductReviewsClientService;
  let productReviewClientRepository: ProductReviewClientRepository;

  const requester = {
    sub: 'user-1',
    email: null,
    role: 'user',
    mobileNumber: '+380991234567',
  };
  const dto = {
    shopId: 'shop-1',
    productId: 'product-1',
    name: 'Олена',
    comment: 'Чудовий товар',
    rating: 5,
  };

  beforeEach(async () => {
    const productReviewClientRepositoryMock = {
      existsActiveProduct: jest.fn(),
      hasPurchasedProduct: jest.fn(),
      findApprovedByProductPaginated: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewsClientService,
        {
          provide: ProductReviewClientRepository,
          useValue: productReviewClientRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProductReviewsClientService>(
      ProductReviewsClientService,
    );
    productReviewClientRepository = module.get<ProductReviewClientRepository>(
      ProductReviewClientRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProductReview', () => {
    it('should create a pending review marked as an approved purchase', async () => {
      const entity = { ...dto } as ProductReview;
      const saved = { id: 'review-1', ...entity };
      jest
        .mocked(productReviewClientRepository.existsActiveProduct)
        .mockResolvedValue(true);
      jest
        .mocked(productReviewClientRepository.hasPurchasedProduct)
        .mockResolvedValue(true);
      jest.mocked(productReviewClientRepository.create).mockReturnValue(entity);
      jest.mocked(productReviewClientRepository.save).mockResolvedValue(saved);

      const result = await service.createProductReview(
        { ...dto, advantages: 'Якість', drawbacks: 'Ціна' },
        requester,
      );

      expect(
        productReviewClientRepository.existsActiveProduct,
      ).toHaveBeenCalledWith('shop-1', 'product-1');
      expect(
        productReviewClientRepository.hasPurchasedProduct,
      ).toHaveBeenCalledWith('user-1', 'shop-1', 'product-1');
      expect(productReviewClientRepository.create).toHaveBeenCalledWith({
        shopId: 'shop-1',
        productId: 'product-1',
        userId: 'user-1',
        name: 'Олена',
        advantages: 'Якість',
        drawbacks: 'Ціна',
        comment: 'Чудовий товар',
        rating: 5,
        status: ProductReviewStatus.PENDING,
        approvedPurchase: true,
      });
      expect(productReviewClientRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(saved);
    });

    it('should store missing pros and cons as null without a purchase', async () => {
      jest
        .mocked(productReviewClientRepository.existsActiveProduct)
        .mockResolvedValue(true);
      jest
        .mocked(productReviewClientRepository.hasPurchasedProduct)
        .mockResolvedValue(false);
      jest
        .mocked(productReviewClientRepository.create)
        .mockReturnValue({} as ProductReview);

      await service.createProductReview(dto, requester);

      expect(productReviewClientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          advantages: null,
          drawbacks: null,
          approvedPurchase: false,
        }),
      );
    });

    it('should throw NotFoundException when the product is not active in the shop', async () => {
      jest
        .mocked(productReviewClientRepository.existsActiveProduct)
        .mockResolvedValue(false);

      await expect(service.createProductReview(dto, requester)).rejects.toThrow(
        new NotFoundException(PRODUCT_REVIEW_MESSAGES.PRODUCT_NOT_FOUND),
      );
      expect(productReviewClientRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException without a requester', async () => {
      await expect(service.createProductReview(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(
        productReviewClientRepository.existsActiveProduct,
      ).not.toHaveBeenCalled();
    });
  });

  describe('listProductReviews', () => {
    it('should list approved reviews of a product of the shop', async () => {
      const review = { id: 'review-1' } as ProductReview;
      jest
        .mocked(productReviewClientRepository.findApprovedByProductPaginated)
        .mockResolvedValue({ items: [review], total: 1 });

      const result = await service.listProductReviews('product-1', {
        shopId: 'shop-1',
        page: 2,
        limit: 10,
      });

      expect(
        productReviewClientRepository.findApprovedByProductPaginated,
      ).toHaveBeenCalledWith('shop-1', 'product-1', 10, 10);
      expect(result).toEqual({
        items: [review],
        total: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
    });
  });
});
