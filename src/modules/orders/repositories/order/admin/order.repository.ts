import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Order } from '../../../entities/order.entity';
import { OrderQueryRepository } from '../common/order-query.repository';

@Injectable()
export class OrderRepository extends OrderQueryRepository {
  constructor(
    @InjectRepository(Order)
    repository: Repository<Order>,
  ) {
    super(repository);
  }

  async findAllByShopId(
    shopId: string,
    skip: number,
    take: number,
    name?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: Order[]; total: number }> {
    const [items, total] = await this.repository.findAndCount({
      where: {
        shopId,
        ...(name ? { orderNumber: ILike(`%${name}%`) } : {}),
      },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
      order: { createdAt: sortOrder === 'asc' ? 'ASC' : 'DESC' },
      skip,
      take,
    });

    return { items, total };
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

  async remove(order: Order): Promise<Order> {
    return this.repository.remove(order);
  }
}
