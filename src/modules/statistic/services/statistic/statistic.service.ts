import { Injectable } from '@nestjs/common';
import { MONTH_NAMES } from '../../constants/month-names.constants';
import {
  MonthlyStatistic,
  MonthlyStatisticRow,
  ShopStatistic,
} from '../../models/statistic.models';
import { StatisticRepository } from '../../repositories/statistic/statistic.repository';

@Injectable()
export class StatisticService {
  constructor(private readonly statisticRepository: StatisticRepository) {}

  async getShopStatistic(shopId: string): Promise<ShopStatistic> {
    const [orders, products, users] = await Promise.all([
      this.statisticRepository.getMonthlyOrders(shopId),
      this.statisticRepository.getMonthlyProducts(shopId),
      this.statisticRepository.getMonthlyUsers(shopId),
    ]);

    return {
      orders: orders.map((row) => this.toMonthlyStatistic(row)),
      products: products.map((row) => this.toMonthlyStatistic(row)),
      users: users.map((row) => this.toMonthlyStatistic(row)),
    };
  }

  private toMonthlyStatistic(row: MonthlyStatisticRow): MonthlyStatistic {
    const monthNumber = Number(row.month);

    return {
      year: Number(row.year),
      month: MONTH_NAMES[monthNumber - 1],
      monthNumber,
      count: Number(row.count),
    };
  }
}
