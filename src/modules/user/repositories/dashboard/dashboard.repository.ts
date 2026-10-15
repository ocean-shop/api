import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderStatus } from '../../../orders/entities/enums/order.enum';
import { Order } from '../../../orders/entities/order.entity';

// Orders that are not shipped or cancelled yet are still in progress.
export const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
];

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async countOrders(shopId: string, userId: string): Promise<number> {
    return this.orderRepository.count({ where: { shopId, userId } });
  }

  /** The latest active orders of a user in a shop, plus how many there are. */
  async findLastActiveOrders(
    shopId: string,
    userId: string,
    take: number,
  ): Promise<{ items: Order[]; total: number }> {
    const [items, total] = await this.orderRepository.findAndCount({
      where: { shopId, userId, status: In(ACTIVE_ORDER_STATUSES) },
      relations: {
        items: {
          product: true,
        },
      },
      order: { createdAt: 'DESC' },
      take,
    });

    return { items, total };
  }
}
