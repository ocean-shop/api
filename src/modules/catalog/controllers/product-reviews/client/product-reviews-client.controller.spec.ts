import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import type { AuthenticatedRequest } from '../../../../user/models/auth-request.models';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewsClientService } from '../../../services/product-reviews/client/product-reviews-client.service';
import { ProductReviewsClientController } from './product-reviews-client.controller';

describe('ProductReviewsClientController', () => {
  let controller: ProductReviewsClientController;
  let productReviewsClientService: ProductReviewsClientService;

  beforeEach(async () => {
    const productReviewsClientServiceMock = {
      createProductReview: jest.fn(),
      listProductReviews: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductReviewsClientController],
      providers: [
        {
          provide: ProductReviewsClientService,
          useValue: productReviewsClientServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductReviewsClientController>(
      ProductReviewsClientController,
    );
    productReviewsClientService = module.get<ProductReviewsClientService>(
      ProductReviewsClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a review on behalf of the current user', async () => {
    const dto = {
      shopId: 'shop-1',
      productId: 'product-1',
      name: 'Олена',
      comment: 'Чудовий товар',
      rating: 5,
    };
    const request = {
      user: { sub: 'user-1', email: null, mobileNumber: null },
    } as AuthenticatedRequest;
    const saved = { id: 'review-1' } as ProductReview;
    jest
      .mocked(productReviewsClientService.createProductReview)
      .mockResolvedValue(saved);

    const result = await controller.createProductReview(dto, request);

    expect(
      productReviewsClientService.createProductReview,
    ).toHaveBeenCalledWith(dto, request.user);
    expect(result).toBe(saved);
  });

  it('should list approved reviews of a product', async () => {
    const query = { shopId: 'shop-1', page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(productReviewsClientService.listProductReviews)
      .mockResolvedValue(expected);

    const result = await controller.listProductReviews('product-1', query);

    expect(productReviewsClientService.listProductReviews).toHaveBeenCalledWith(
      'product-1',
      query,
    );
    expect(result).toBe(expected);
  });
});
