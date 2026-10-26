import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from '../../../entities/order.entity';
import { PaginatedResult } from '../../../../../core/response/models/response.models';
import { ORDER_MESSAGES } from '../../../constants/order-messages.constants';

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
      throw new NotFoundException(ORDER_MESSAGES.NOT_FOUND);
    }

    return order;
  }

  async findAllByShopIdAndUserId(
    shopId: string,
    userId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<Order>> {
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
