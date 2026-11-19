import { Test, TestingModule } from '@nestjs/testing';
import { RelatedProductsClientService } from '../../../services/related-products/client/related-products-client.service';
import { RelatedProductsClientController } from './related-products-client.controller';

describe('RelatedProductsClientController', () => {
  let controller: RelatedProductsClientController;
  let relatedProductsClientService: RelatedProductsClientService;

  const productId = 'c4d2b3e5-0000-4000-8000-000000000002';
  const shopId = 'b3c1a2d4-0000-4000-8000-000000000001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatedProductsClientController],
      providers: [
        {
          provide: RelatedProductsClientService,
          useValue: { listRelatedProducts: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<RelatedProductsClientController>(
      RelatedProductsClientController,
    );
    relatedProductsClientService = module.get<RelatedProductsClientService>(
      RelatedProductsClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call relatedProductsClientService.listRelatedProducts', async () => {
    const expectedResult = [{ id: 'related-1' }];
    jest
      .mocked(relatedProductsClientService.listRelatedProducts)
      .mockResolvedValue(expectedResult as any);

    const result = await controller.listRelatedProducts(productId, shopId);

    expect(
      relatedProductsClientService.listRelatedProducts,
    ).toHaveBeenCalledWith(productId, shopId);
    expect(result).toEqual(expectedResult);
  });
});
