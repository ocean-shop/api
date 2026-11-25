import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { ProductReviewStatus } from '../../../entities/enums/product-review.enum';
import { ProductReview } from '../../../entities/product-review.entity';
import { ProductReviewsService } from '../../../services/product-reviews/admin/product-reviews.service';
import { ProductReviewsController } from './product-reviews.controller';

describe('ProductReviewsController', () => {
  let controller: ProductReviewsController;
  let productReviewsService: ProductReviewsService;

  beforeEach(async () => {
    const productReviewsServiceMock = {
      listProductReviews: jest.fn(),
      updateProductReviewStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductReviewsController],
      providers: [
        { provide: ProductReviewsService, useValue: productReviewsServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductReviewsController>(ProductReviewsController);
    productReviewsService = module.get<ProductReviewsService>(
      ProductReviewsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list product reviews of a shop', async () => {
    const query = { shopId: 'shop-1', page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(productReviewsService.listProductReviews)
      .mockResolvedValue(expected);

    const result = await controller.listProductReviews(query);

    expect(productReviewsService.listProductReviews).toHaveBeenCalledWith(
      query,
    );
    expect(result).toBe(expected);
  });

  it('should update the status of a product review', async () => {
    const dto = { status: ProductReviewStatus.APPROVED };
    const expected = { id: 'review-1', ...dto } as ProductReview;
    jest
      .mocked(productReviewsService.updateProductReviewStatus)
      .mockResolvedValue(expected);

    const result = await controller.updateProductReviewStatus('review-1', dto);

    expect(
      productReviewsService.updateProductReviewStatus,
    ).toHaveBeenCalledWith('review-1', dto);
    expect(result).toBe(expected);
  });
});
