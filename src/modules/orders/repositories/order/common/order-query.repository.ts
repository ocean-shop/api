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

  async findAllByShopIdAndUserId(
    shopId: string,
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ items: Order[]; total: number }> {
    const [items, total] = await this.repository.findAndCount({
      where: { shopId, userId },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { items, total };
  }

  async save(order: Order): Promise<Order> {
    return this.repository.save(order);
  }
}
