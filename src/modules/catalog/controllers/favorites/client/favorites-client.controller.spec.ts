import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesClientController } from './favorites-client.controller';
import { FavoritesClientService } from '../../../services/favorites/client/favorites-client.service';
import { AddFavoriteProductDto } from '../../../dto/favorites/add-favorite-product.dto';
import { ListFavoriteProductsQueryDto } from '../../../dto/favorites/list-favorite-products-query.dto';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles.guard';
import { AuthenticatedRequest } from '../../../../user/models/auth-request.models';

describe('FavoritesClientController', () => {
  let controller: FavoritesClientController;
  let favoritesClientService: FavoritesClientService;

  const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
  const shopId = 'b3c1a2d4-0000-4000-8000-000000000001';
  const productId = 'c4d2b3e5-0000-4000-8000-000000000002';
  const request = {
    user: { sub: userId, email: null, role: 'user', mobileNumber: null },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const favoritesClientServiceMock = {
      listFavoriteProducts: jest.fn(),
      addFavoriteProduct: jest.fn(),
      removeFavoriteProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesClientController],
      providers: [
        {
          provide: FavoritesClientService,
          useValue: favoritesClientServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FavoritesClientController>(
      FavoritesClientController,
    );
    favoritesClientService = module.get<FavoritesClientService>(
      FavoritesClientService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listFavoriteProducts', () => {
    it('should call favoritesClientService.listFavoriteProducts', async () => {
      const query: ListFavoriteProductsQueryDto = {
        shopId,
        page: 1,
        limit: 20,
      };
      const expectedResult = {
        items: [{ id: productId, shopId, name: 'Product' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      jest
        .mocked(favoritesClientService.listFavoriteProducts)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.listFavoriteProducts(
        userId,
        query,
        request,
      );

      expect(favoritesClientService.listFavoriteProducts).toHaveBeenCalledWith(
        userId,
        query,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('addFavoriteProduct', () => {
    it('should call favoritesClientService.addFavoriteProduct', async () => {
      const dto: AddFavoriteProductDto = { shopId, productId };
      const expectedResult = { userId, ...dto, createdAt: new Date() };

      jest
        .mocked(favoritesClientService.addFavoriteProduct)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.addFavoriteProduct(userId, dto, request);

      expect(favoritesClientService.addFavoriteProduct).toHaveBeenCalledWith(
        userId,
        dto,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeFavoriteProduct', () => {
    it('should call favoritesClientService.removeFavoriteProduct', async () => {
      jest
        .mocked(favoritesClientService.removeFavoriteProduct)
        .mockResolvedValue(undefined);

      await controller.removeFavoriteProduct(userId, productId, request);

      expect(favoritesClientService.removeFavoriteProduct).toHaveBeenCalledWith(
        userId,
        productId,
        request.user,
      );
    });
  });
});
