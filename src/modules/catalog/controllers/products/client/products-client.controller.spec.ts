import { Test, TestingModule } from '@nestjs/testing';
import { CatalogProductSort } from '../../../models/product.models';
import { ProductsClientService } from '../../../services/products/client/products-client.service';
import { ProductsService } from '../../../services/products/admin/products.service';
import { ProductsClientController } from './products-client.controller';

describe('ProductsClientController', () => {
  let controller: ProductsClientController;
  let productsService: ProductsService;
  let productsClientService: ProductsClientService;

  beforeEach(async () => {
    const productsServiceMock = {
      listPopularProducts: jest.fn(),
    };

    const productsClientServiceMock = {
      listCatalogProducts: jest.fn(),
      getFiltersByCategoryId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsClientController],
      providers: [
        { provide: ProductsService, useValue: productsServiceMock },
        { provide: ProductsClientService, useValue: productsClientServiceMock },
      ],
    }).compile();

    controller = module.get<ProductsClientController>(ProductsClientController);
    productsService = module.get<ProductsService>(ProductsService);
    productsClientService = module.get<ProductsClientService>(
      ProductsClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list popular products', async () => {
    const expected = [{ id: '1', name: 'Ocean Tee', isPopular: true }];
    jest
      .mocked(productsService.listPopularProducts)
      .mockResolvedValue(expected as any);

    const result = await controller.listPopularProducts();

    expect(productsService.listPopularProducts).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(expected);
  });

  it('should list popular products filtered by shop id', async () => {
    const shopId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = [{ id: '1', name: 'Ocean Tee', isPopular: true }];
    jest
      .mocked(productsService.listPopularProducts)
      .mockResolvedValue(expected as any);

    const result = await controller.listPopularProducts(shopId);

    expect(productsService.listPopularProducts).toHaveBeenCalledWith(shopId);
    expect(result).toEqual(expected);
  });

  it('should list catalog products by category id', async () => {
    const categoryId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const query = {
      page: 1,
      limit: 20,
      attributes: [{ name: 'color', values: ['Red'] }],
      priceFrom: 60,
      priceTo: 6000,
      available: true,
      sort: CatalogProductSort.CHEAPER,
    };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest
      .mocked(productsClientService.listCatalogProducts)
      .mockResolvedValue(expected);

    const result = await controller.listCatalogProducts(categoryId, query);

    expect(productsClientService.listCatalogProducts).toHaveBeenCalledWith(
      categoryId,
      query,
    );
    expect(result).toEqual(expected);
  });

  it('should get catalog filters by category id', async () => {
    const categoryId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = [{ name: 'Color', values: ['Blue', 'Red'] }];
    jest
      .mocked(productsClientService.getFiltersByCategoryId)
      .mockResolvedValue(expected);

    const result = await controller.getFiltersByCategoryId(categoryId);

    expect(productsClientService.getFiltersByCategoryId).toHaveBeenCalledWith(
      categoryId,
    );
    expect(result).toEqual(expected);
  });
});
