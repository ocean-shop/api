import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { AssignRelatedProductsDto } from '../../../dto/products/assign-related-products.dto';
import { RelatedProductsService } from '../../../services/related-products/admin/related-products.service';
import { RelatedProductsController } from './related-products.controller';

describe('RelatedProductsController', () => {
  let controller: RelatedProductsController;
  let relatedProductsService: RelatedProductsService;

  const productId = 'c4d2b3e5-0000-4000-8000-000000000002';
  const relatedId = 'd5e3c4f6-0000-4000-8000-000000000003';

  beforeEach(async () => {
    const relatedProductsServiceMock = {
      listRelatedProducts: jest.fn(),
      assignRelatedProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatedProductsController],
      providers: [
        {
          provide: RelatedProductsService,
          useValue: relatedProductsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RelatedProductsController>(
      RelatedProductsController,
    );
    relatedProductsService = module.get<RelatedProductsService>(
      RelatedProductsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call relatedProductsService.listRelatedProducts', async () => {
    const expectedResult = [{ id: relatedId }];
    jest
      .mocked(relatedProductsService.listRelatedProducts)
      .mockResolvedValue(expectedResult as any);

    const result = await controller.listRelatedProducts(productId);

    expect(relatedProductsService.listRelatedProducts).toHaveBeenCalledWith(
      productId,
    );
    expect(result).toEqual(expectedResult);
  });

  it('should call relatedProductsService.assignRelatedProducts', async () => {
    const dto: AssignRelatedProductsDto = { productIds: [relatedId] };
    const expectedResult = [{ id: relatedId }];
    jest
      .mocked(relatedProductsService.assignRelatedProducts)
      .mockResolvedValue(expectedResult as any);

    const result = await controller.assignRelatedProducts(productId, dto);

    expect(relatedProductsService.assignRelatedProducts).toHaveBeenCalledWith(
      productId,
      dto,
    );
    expect(result).toEqual(expectedResult);
  });
});
