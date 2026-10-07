import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from '../../../entities/order.entity';

export abstract class OrderQueryRepository {
  protected constructor(protected readonly repository: Repository<Order>) {}

  async findById(id: string): Promise<Order> {
    const order = await this.repository.findOne({
      where: { id },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Замовлення не знайдено');
    }

    return order;
  }

  async save(order: Order): Promise<Order> {
    return this.repository.save(order);
  }
}
