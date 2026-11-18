import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShopSettings } from '../../entities/shop-settings.entity';
import { ShopSettingsRepository } from './shop-settings.repository';

describe('ShopSettingsRepository', () => {
  let repository: ShopSettingsRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    typeOrmRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopSettingsRepository,
        {
          provide: getRepositoryToken(ShopSettings),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ShopSettingsRepository>(ShopSettingsRepository);
  });

  it('should find settings by shop id', async () => {
    const settings = { shopId: 'shop-1' } as ShopSettings;
    typeOrmRepository.findOne.mockResolvedValue(settings);

    await expect(repository.findByShopId('shop-1')).resolves.toBe(settings);
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { shopId: 'shop-1' },
    });
  });

  it('should insert default settings ignoring conflicts and return the row', async () => {
    const settings = { shopId: 'shop-1' } as ShopSettings;
    typeOrmRepository.findOneOrFail.mockResolvedValue(settings);

    const result = await repository.createDefault('shop-1');

    expect(result).toBe(settings);
    expect(queryBuilder.into).toHaveBeenCalledWith(ShopSettings);
    expect(queryBuilder.values).toHaveBeenCalledWith({ shopId: 'shop-1' });
    expect(queryBuilder.orIgnore).toHaveBeenCalled();
    expect(queryBuilder.execute).toHaveBeenCalled();
    expect(typeOrmRepository.findOneOrFail).toHaveBeenCalledWith({
      where: { shopId: 'shop-1' },
    });
  });

  it('should save settings', async () => {
    const settings = { shopId: 'shop-1' } as ShopSettings;
    typeOrmRepository.save.mockResolvedValue(settings);

    await expect(repository.save(settings)).resolves.toBe(settings);
    expect(typeOrmRepository.save).toHaveBeenCalledWith(settings);
  });
});
