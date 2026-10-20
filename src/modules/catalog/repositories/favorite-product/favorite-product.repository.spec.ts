import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductStatus } from '../../entities/enums/product.enum';
import { Product } from '../../entities/product.entity';
import { UserFavoriteProduct } from '../../entities/user-favorite-product.entity';
import { FavoriteProductRepository } from './favorite-product.repository';

describe('FavoriteProductRepository', () => {
  let repository: FavoriteProductRepository;
  let productRepository: any;
  let favoriteRepository: any;
  let insertBuilder: any;

  beforeEach(async () => {
    insertBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    productRepository = { exists: jest.fn() };
    favoriteRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(insertBuilder),
      findOneOrFail: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteProductRepository,
        { provide: getRepositoryToken(Product), useValue: productRepository },
        {
          provide: getRepositoryToken(UserFavoriteProduct),
          useValue: favoriteRepository,
        },
      ],
    }).compile();

    repository = module.get<FavoriteProductRepository>(
      FavoriteProductRepository,
    );
  });

  it('should check that the product is active in the shop', async () => {
    productRepository.exists.mockResolvedValue(true);

    const result = await repository.existsActiveProduct('shop-1', 'product-1');

    expect(productRepository.exists).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
        shopId: 'shop-1',
        status: ProductStatus.ACTIVE,
      },
    });
    expect(result).toBe(true);
  });

  it('should insert the favorite ignoring duplicates and return it', async () => {
    const favorite = { userId: 'user-1', productId: 'product-1' };
    favoriteRepository.findOneOrFail.mockResolvedValue(favorite);

    const result = await repository.add('user-1', 'shop-1', 'product-1');

    expect(insertBuilder.into).toHaveBeenCalledWith(UserFavoriteProduct);
    expect(insertBuilder.values).toHaveBeenCalledWith({
      userId: 'user-1',
      shopId: 'shop-1',
      productId: 'product-1',
    });
    expect(insertBuilder.orIgnore).toHaveBeenCalled();
    expect(insertBuilder.execute).toHaveBeenCalled();
    expect(favoriteRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { userId: 'user-1', productId: 'product-1' },
    });
    expect(result).toBe(favorite);
  });

  it('should report a removed favorite', async () => {
    favoriteRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(repository.remove('user-1', 'product-1')).resolves.toBe(true);
    expect(favoriteRepository.delete).toHaveBeenCalledWith({
      userId: 'user-1',
      productId: 'product-1',
    });
  });

  it.each([{ affected: 0 }, { affected: undefined }])(
    'should report nothing removed when affected is %o',
    async (deleteResult) => {
      favoriteRepository.delete.mockResolvedValue(deleteResult);

      await expect(repository.remove('user-1', 'product-1')).resolves.toBe(
        false,
      );
    },
  );

  it('should page the active favorites of the user, newest first', async () => {
    const page = { items: [{ id: 'product-1' }], total: 1 };
    const query = {
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    };
    const findPaginated = jest
      .spyOn(repository as any, 'findPaginatedWithRelations')
      .mockImplementation((applyFilters: any) => {
        applyFilters(query);
        return Promise.resolve(page);
      });

    const result = await repository.findProductsPaginated(
      'user-1',
      'shop-1',
      0,
      20,
    );

    expect(findPaginated).toHaveBeenCalledWith(expect.any(Function), 0, 20, [
      { expression: 'favorite.createdAt', direction: 'DESC' },
    ]);
    expect(query.innerJoin).toHaveBeenCalledWith(
      UserFavoriteProduct,
      'favorite',
      'favorite.productId = product.id',
    );
    expect(query.andWhere).toHaveBeenCalledWith('favorite.userId = :userId', {
      userId: 'user-1',
    });
    expect(query.andWhere).toHaveBeenCalledWith('favorite.shopId = :shopId', {
      shopId: 'shop-1',
    });
    expect(query.andWhere).toHaveBeenCalledWith('product.status = :status', {
      status: ProductStatus.ACTIVE,
    });
    expect(result).toBe(page);
  });
});
