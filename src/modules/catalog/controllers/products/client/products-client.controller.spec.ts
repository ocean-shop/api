import { Test, TestingModule } from '@nestjs/testing';
import { CatalogProductSort } from '../../../models/product.models';
import { ProductsClientService } from '../../../services/products/client/products-client.service';
import { ProductsClientController } from './products-client.controller';

describe('ProductsClientController', () => {
  let controller: ProductsClientController;
  let productsClientService: ProductsClientService;

  beforeEach(async () => {
    const productsClientServiceMock = {
      listPopularProducts: jest.fn(),
      listCatalogProducts: jest.fn(),
      listCatalogProductsBySearch: jest.fn(),
      getFiltersByCategoryId: jest.fn(),
      getProductById: jest.fn(),
      searchProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsClientController],
      providers: [
        { provide: ProductsClientService, useValue: productsClientServiceMock },
      ],
    }).compile();

    controller = module.get<ProductsClientController>(ProductsClientController);
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
      .mocked(productsClientService.listPopularProducts)
      .mockResolvedValue(expected as any);

    const result = await controller.listPopularProducts();

    expect(productsClientService.listPopularProducts).toHaveBeenCalledWith(
      undefined,
    );
    expect(result).toEqual(expected);
  });

  it('should list popular products filtered by shop id', async () => {
    const shopId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = [{ id: '1', name: 'Ocean Tee', isPopular: true }];
    jest
      .mocked(productsClientService.listPopularProducts)
      .mockResolvedValue(expected as any);

    const result = await controller.listPopularProducts(shopId);

    expect(productsClientService.listPopularProducts).toHaveBeenCalledWith(
      shopId,
    );
    expect(result).toEqual(expected);
  });

  it('should list catalog products by category id', async () => {
    const categoryId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const query = {
      shopId: '5d4d8a1f-3a1c-4c0e-8a0b-2f6f1c9d4e7b',
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

  it('should list catalog products by a search string', async () => {
    const query = {
      shopId: '5d4d8a1f-3a1c-4c0e-8a0b-2f6f1c9d4e7b',
      query: 'ocean tee',
      page: 2,
      limit: 20,
      attributes: [{ name: 'color', values: ['Red'] }],
      priceFrom: 60,
      priceTo: 6000,
      available: true,
      sort: CatalogProductSort.CHEAPER,
    };
    const expected = {
      items: [],
      total: 0,
      page: 2,
      limit: 20,
      totalPages: 0,
      filters: [{ name: 'Color', values: ['Blue', 'Red'] }],
    };
    jest
      .mocked(productsClientService.listCatalogProductsBySearch)
      .mockResolvedValue(expected);

    const result = await controller.listCatalogProductsBySearch(query);

    expect(
      productsClientService.listCatalogProductsBySearch,
    ).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should search products by the string from the user', async () => {
    const query = {
      shopId: '5d4d8a1f-3a1c-4c0e-8a0b-2f6f1c9d4e7b',
      query: 'ocean tee',
    };
    const expected = {
      total: 42,
      items: [
        {
          id: '1',
          name: 'Ocean Tee',
          price: '100.00',
          oldPrice: '120.00',
          image: 'https://cdn/main.png',
        },
      ],
    };
    jest
      .mocked(productsClientService.searchProducts)
      .mockResolvedValue(expected);

    const result = await controller.searchProducts(query);

    expect(productsClientService.searchProducts).toHaveBeenCalledWith(
      query.shopId,
      query.query,
    );
    expect(result).toEqual(expected);
  });

  it('should get catalog filters by category id', async () => {
    const categoryId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const shopId = '5d4d8a1f-3a1c-4c0e-8a0b-2f6f1c9d4e7b';
    const expected = [{ name: 'Color', values: ['Blue', 'Red'] }];
    jest
      .mocked(productsClientService.getFiltersByCategoryId)
      .mockResolvedValue(expected);

    const result = await controller.getFiltersByCategoryId(categoryId, shopId);

    expect(productsClientService.getFiltersByCategoryId).toHaveBeenCalledWith(
      categoryId,
      shopId,
    );
    expect(result).toEqual(expected);
  });

  it('should get a product by id and shop id', async () => {
    const productId = '98f21967-fce6-4ceb-af61-304913f593a7';
    const shopId = '5d4d8a1f-3a1c-4c0e-8a0b-2f6f1c9d4e7b';
    const expected = {
      id: productId,
      name: 'Ocean Tee',
      images: [],
      tags: [],
      variations: [],
    };
    jest
      .mocked(productsClientService.getProductById)
      .mockResolvedValue(expected as any);

    const result = await controller.getProductById(productId, shopId);

    expect(productsClientService.getProductById).toHaveBeenCalledWith(
      productId,
      shopId,
    );
    expect(result).toEqual(expected);
  });
});
