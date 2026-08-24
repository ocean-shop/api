import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../catalog/entities/product.entity';
import { Order } from '../../../orders/entities/order.entity';
import { User } from '../../../user/entities/user.entity';
import { MonthlyStatisticRow } from '../../models/statistic.models';

@Injectable()
export class StatisticRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMonthlyOrders(shopId: string): Promise<MonthlyStatisticRow[]> {
    return this.orderRepository
      .createQueryBuilder('o')
      .select('EXTRACT(YEAR FROM o.created_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM o.created_at)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('o.shop_id = :shopId', { shopId })
      .groupBy('year')
      .addGroupBy('month')
      .orderBy('year', 'ASC')
      .addOrderBy('month', 'ASC')
      .getRawMany<MonthlyStatisticRow>();
  }

  async getMonthlyProducts(shopId: string): Promise<MonthlyStatisticRow[]> {
    return this.productRepository
      .createQueryBuilder('p')
      .select('EXTRACT(YEAR FROM p.created_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM p.created_at)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('p.shop_id = :shopId', { shopId })
      .groupBy('year')
      .addGroupBy('month')
      .orderBy('year', 'ASC')
      .addOrderBy('month', 'ASC')
      .getRawMany<MonthlyStatisticRow>();
  }

  async getMonthlyUsers(shopId: string): Promise<MonthlyStatisticRow[]> {
    return this.userRepository
      .createQueryBuilder('u')
      .innerJoin(Order, 'o', 'o.user_id = u.id')
      .select('EXTRACT(YEAR FROM u.created_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM u.created_at)', 'month')
      .addSelect('COUNT(DISTINCT u.id)', 'count')
      .where('o.shop_id = :shopId', { shopId })
      .groupBy('year')
      .addGroupBy('month')
      .orderBy('year', 'ASC')
      .addOrderBy('month', 'ASC')
      .getRawMany<MonthlyStatisticRow>();
  }
}
