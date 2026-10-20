import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../../../orders/entities/order.entity';
import { ACTIVE_ORDER_STATUSES } from '../../constants/dashboard.constants';
import { PaginatedResult } from '../../../../core/response/models/response.models';

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
  ): Promise<PaginatedResult<Order>> {
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
