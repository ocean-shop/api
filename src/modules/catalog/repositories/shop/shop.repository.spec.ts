import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SHOP_MESSAGES } from '../../constants/shop-messages.constants';
import { Shop } from '../../entities/shop.entity';
import { ShopRepository } from './shop.repository';

describe('ShopRepository', () => {
  let repository: ShopRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopRepository,
        { provide: getRepositoryToken(Shop), useValue: typeOrmRepository },
      ],
    }).compile();

    repository = module.get<ShopRepository>(ShopRepository);
  });

  it('should find paginated shops newest first', async () => {
    const shops = [{ id: 'shop-1' }] as Shop[];
    queryBuilder.getManyAndCount.mockResolvedValue([shops, 1]);

    const result = await repository.findAllPaginated(20, 10);

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('shop');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('shop.createdAt', 'DESC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({ items: shops, total: 1 });
  });

  it('should find a shop by id', async () => {
    const shop = { id: 'shop-1' } as Shop;
    typeOrmRepository.findOne.mockResolvedValue(shop);

    const result = await repository.findById('shop-1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'shop-1' },
    });
    expect(result).toBe(shop);
  });

  it('should throw NotFoundException when the shop does not exist', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      new NotFoundException(SHOP_MESSAGES.NOT_FOUND),
    );
  });

  it('should delegate create, save and remove to TypeORM', async () => {
    const shop = { id: 'shop-1', name: 'Ocean' } as Shop;
    typeOrmRepository.create.mockReturnValue(shop);
    typeOrmRepository.save.mockResolvedValue(shop);
    typeOrmRepository.remove.mockResolvedValue(shop);

    expect(repository.create({ name: 'Ocean' })).toBe(shop);
    await expect(repository.save(shop)).resolves.toBe(shop);
    await expect(repository.remove(shop)).resolves.toBe(shop);

    expect(typeOrmRepository.create).toHaveBeenCalledWith({ name: 'Ocean' });
    expect(typeOrmRepository.save).toHaveBeenCalledWith(shop);
    expect(typeOrmRepository.remove).toHaveBeenCalledWith(shop);
  });
});
