import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../../../catalog/entities/product.entity';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrderClientRepository } from './quick-order-client.repository';

describe('QuickOrderClientRepository', () => {
  let repository: QuickOrderClientRepository;
  let typeOrmRepository: any;
  let productRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    productRepository = {
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickOrderClientRepository,
        {
          provide: getRepositoryToken(QuickOrder),
          useValue: typeOrmRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    repository = module.get<QuickOrderClientRepository>(
      QuickOrderClientRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should check that the product belongs to the shop', async () => {
    productRepository.exists.mockResolvedValue(true);

    const result = await repository.existsProductInShop(
      'shop-id',
      'product-id',
    );

    expect(productRepository.exists).toHaveBeenCalledWith({
      where: { id: 'product-id', shopId: 'shop-id' },
    });
    expect(result).toBe(true);
  });

  it('should create quick order entity', () => {
    const payload = { name: 'Олена' };
    const entity = { id: '1', ...payload };
    typeOrmRepository.create.mockReturnValue(entity);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toBe(entity);
  });

  it('should save quick order', async () => {
    const quickOrder = { id: '1' } as QuickOrder;
    typeOrmRepository.save.mockResolvedValue(quickOrder);

    const result = await repository.save(quickOrder);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(quickOrder);
    expect(result).toBe(quickOrder);
  });
});
