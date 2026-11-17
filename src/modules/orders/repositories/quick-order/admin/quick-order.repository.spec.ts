import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuickOrderStatus } from '../../../entities/enums/quick-order.enum';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrderRepository } from './quick-order.repository';

describe('QuickOrderRepository', () => {
  let repository: QuickOrderRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickOrderRepository,
        {
          provide: getRepositoryToken(QuickOrder),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<QuickOrderRepository>(QuickOrderRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAllPaginated', () => {
    it('should find quick orders of a shop newest first without filters', async () => {
      const items = [{ id: '1' }] as QuickOrder[];
      queryBuilder.getManyAndCount.mockResolvedValue([items, 1]);

      const result = await repository.findAllPaginated(
        { shopId: 'shop-id' },
        0,
        20,
      );

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
        'quickOrder',
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'quickOrder.product',
        'product',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'quickOrder.shopId = :shopId',
        { shopId: 'shop-id' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'quickOrder.createdAt',
        'DESC',
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual({ items, total: 1 });
    });

    it('should sort ascending when requested', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findAllPaginated(
        { shopId: 'shop-id', sortOrder: 'asc' },
        0,
        20,
      );

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'quickOrder.createdAt',
        'ASC',
      );
    });

    it('should filter by status', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findAllPaginated(
        { shopId: 'shop-id', status: QuickOrderStatus.NEW },
        0,
        20,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'quickOrder.status = :status',
        { status: QuickOrderStatus.NEW },
      );
    });

    it('should search by name or phone', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findAllPaginated(
        { shopId: 'shop-id', search: '099' },
        0,
        20,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(quickOrder.name ILIKE :search OR quickOrder.phone ILIKE :search)',
        { search: '%099%' },
      );
    });
  });

  describe('findById', () => {
    it('should find quick order with its product', async () => {
      const quickOrder = { id: '1' } as QuickOrder;
      typeOrmRepository.findOne.mockResolvedValue(quickOrder);

      const result = await repository.findById('1');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          relations: { product: true },
        }),
      );
      expect(result).toBe(quickOrder);
    });

    it('should throw when quick order does not exist', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('should save quick order', async () => {
    const quickOrder = { id: '1' } as QuickOrder;
    typeOrmRepository.save.mockResolvedValue(quickOrder);

    const result = await repository.save(quickOrder);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(quickOrder);
    expect(result).toBe(quickOrder);
  });

  it('should remove quick order', async () => {
    const quickOrder = { id: '1' } as QuickOrder;
    typeOrmRepository.remove.mockResolvedValue(quickOrder);

    const result = await repository.remove(quickOrder);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(quickOrder);
    expect(result).toBe(quickOrder);
  });
});
