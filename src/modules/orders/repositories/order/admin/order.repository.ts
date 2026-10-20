import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Order } from '../../../entities/order.entity';
import { OrderQueryRepository } from '../common/order-query.repository';
import { DEFAULT_SORT_ORDER } from '../../../../../core/response/constants/sort.constants';
import {
  PaginatedResult,
  SortOrder,
} from '../../../../../core/response/models/response.models';

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
    sortOrder: SortOrder = DEFAULT_SORT_ORDER,
  ): Promise<PaginatedResult<Order>> {
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

  async remove(order: Order): Promise<Order> {
    return this.repository.remove(order);
  }
}
