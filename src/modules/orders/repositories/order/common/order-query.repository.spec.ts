import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from '../../../entities/order.entity';
import { OrderQueryRepository } from './order-query.repository';

class TestOrderQueryRepository extends OrderQueryRepository {
  constructor(repository: Repository<Order>) {
    super(repository);
  }
}

describe('OrderQueryRepository', () => {
  let repository: TestOrderQueryRepository;
  let typeOrmRepository: any;

  beforeEach(() => {
    typeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    repository = new TestOrderQueryRepository(typeOrmRepository);
  });

  it('should find order by id', async () => {
    const order = { id: 'order-id' } as Order;
    typeOrmRepository.findOne.mockResolvedValue(order);

    const result = await repository.findById('order-id');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
    });
    expect(result).toEqual(order);
  });

  it('should throw when order not found', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should save order entity', async () => {
    const order = { id: 'order-id' } as Order;
    typeOrmRepository.save.mockResolvedValue(order);

    const result = await repository.save(order);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(order);
    expect(result).toEqual(order);
  });
});
