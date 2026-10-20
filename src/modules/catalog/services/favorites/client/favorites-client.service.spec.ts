import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_MESSAGES } from '../../../../user/constants/auth-messages.constants';
import { JwtPayload } from '../../../../user/models/auth-request.models';
import { FAVORITE_MESSAGES } from '../../../constants/favorite-messages.constants';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import { FavoriteProductRepository } from '../../../repositories/favorite-product/favorite-product.repository';
import { FavoritesClientService } from './favorites-client.service';

const USER_ID = 'user-1';
const SHOP_ID = 'shop-1';
const PRODUCT_ID = 'product-1';

const requesterOf = (sub: string, role: string): JwtPayload => ({
  sub,
  role,
  email: null,
  mobileNumber: null,
});

describe('FavoritesClientService', () => {
  let service: FavoritesClientService;
  let favoriteProductRepository: jest.Mocked<
    Pick<
      FavoriteProductRepository,
      'existsActiveProduct' | 'add' | 'remove' | 'findProductsPaginated'
    >
  >;

  beforeEach(async () => {
    favoriteProductRepository = {
      existsActiveProduct: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      findProductsPaginated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesClientService,
        {
          provide: FavoriteProductRepository,
          useValue: favoriteProductRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesClientService>(FavoritesClientService);
  });

  describe('addFavoriteProduct', () => {
    const dto = { shopId: SHOP_ID, productId: PRODUCT_ID };

    it('should add an active product to the favorites', async () => {
      const favorite = { userId: USER_ID, productId: PRODUCT_ID } as any;
      favoriteProductRepository.existsActiveProduct.mockResolvedValue(true);
      favoriteProductRepository.add.mockResolvedValue(favorite);

      const result = await service.addFavoriteProduct(
        USER_ID,
        dto,
        requesterOf(USER_ID, 'user'),
      );

      expect(
        favoriteProductRepository.existsActiveProduct,
      ).toHaveBeenCalledWith(SHOP_ID, PRODUCT_ID);
      expect(favoriteProductRepository.add).toHaveBeenCalledWith(
        USER_ID,
        SHOP_ID,
        PRODUCT_ID,
      );
      expect(result).toBe(favorite);
    });

    it('should throw NotFoundException when the product is not active', async () => {
      favoriteProductRepository.existsActiveProduct.mockResolvedValue(false);

      await expect(service.addFavoriteProduct(USER_ID, dto)).rejects.toThrow(
        new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND),
      );
      expect(favoriteProductRepository.add).not.toHaveBeenCalled();
    });

    it('should forbid a user from changing the favorites of another user', async () => {
      await expect(
        service.addFavoriteProduct(USER_ID, dto, requesterOf('other', 'user')),
      ).rejects.toThrow(new ForbiddenException(AUTH_MESSAGES.ACCESS_DENIED));
      expect(
        favoriteProductRepository.existsActiveProduct,
      ).not.toHaveBeenCalled();
    });

    it('should let an admin change the favorites of any user', async () => {
      favoriteProductRepository.existsActiveProduct.mockResolvedValue(true);

      await service.addFavoriteProduct(
        USER_ID,
        dto,
        requesterOf('admin-1', 'admin'),
      );

      expect(favoriteProductRepository.add).toHaveBeenCalled();
    });
  });

  describe('removeFavoriteProduct', () => {
    it('should remove a favorite', async () => {
      favoriteProductRepository.remove.mockResolvedValue(true);

      await expect(
        service.removeFavoriteProduct(USER_ID, PRODUCT_ID),
      ).resolves.toBeUndefined();
      expect(favoriteProductRepository.remove).toHaveBeenCalledWith(
        USER_ID,
        PRODUCT_ID,
      );
    });

    it('should throw NotFoundException when the product was not a favorite', async () => {
      favoriteProductRepository.remove.mockResolvedValue(false);

      await expect(
        service.removeFavoriteProduct(USER_ID, PRODUCT_ID),
      ).rejects.toThrow(new NotFoundException(FAVORITE_MESSAGES.NOT_FOUND));
    });

    it('should forbid a user from removing the favorites of another user', async () => {
      await expect(
        service.removeFavoriteProduct(
          USER_ID,
          PRODUCT_ID,
          requesterOf('other', 'user'),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(favoriteProductRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('listFavoriteProducts', () => {
    it('should return a page of favorite products', async () => {
      const items = [{ id: PRODUCT_ID }] as any;
      favoriteProductRepository.findProductsPaginated.mockResolvedValue({
        items,
        total: 3,
      });

      const result = await service.listFavoriteProducts(USER_ID, {
        shopId: SHOP_ID,
        page: 2,
        limit: 2,
      });

      expect(
        favoriteProductRepository.findProductsPaginated,
      ).toHaveBeenCalledWith(USER_ID, SHOP_ID, 2, 2);
      expect(result).toEqual({
        items,
        total: 3,
        page: 2,
        limit: 2,
        totalPages: 2,
      });
    });

    it('should forbid a user from listing the favorites of another user', async () => {
      await expect(
        service.listFavoriteProducts(
          USER_ID,
          { shopId: SHOP_ID, page: 1, limit: 20 },
          requesterOf('other', 'user'),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(
        favoriteProductRepository.findProductsPaginated,
      ).not.toHaveBeenCalled();
    });
  });
});
