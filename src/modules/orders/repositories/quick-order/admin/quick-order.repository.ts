import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../../../core/response/models/response.models';
import { QUICK_ORDER_MESSAGES } from '../../../constants/quick-order-messages.constants';
import { QUICK_ORDER_PRODUCT_SELECT } from '../../../constants/quick-order.constants';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrderFilters } from '../../../models/quick-order.models';

@Injectable()
export class QuickOrderRepository {
  constructor(
    @InjectRepository(QuickOrder)
    private readonly repository: Repository<QuickOrder>,
  ) {}

  async findAllPaginated(
    filters: QuickOrderFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<QuickOrder>> {
    const query = this.repository
      .createQueryBuilder('quickOrder')
      .leftJoin('quickOrder.product', 'product')
      .addSelect(
        Object.keys(QUICK_ORDER_PRODUCT_SELECT).map(
          (field) => `product.${field}`,
        ),
      )
      .where('quickOrder.shopId = :shopId', { shopId: filters.shopId })
      .orderBy(
        'quickOrder.createdAt',
        filters.sortOrder === 'asc' ? 'ASC' : 'DESC',
      )
      .skip(skip)
      .take(take);

    if (filters.status) {
      query.andWhere('quickOrder.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere(
        '(quickOrder.name ILIKE :search OR quickOrder.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<QuickOrder> {
    const quickOrder = await this.repository.findOne({
      where: { id },
      relations: { product: true },
      select: {
        id: true,
        shopId: true,
        productId: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        product: QUICK_ORDER_PRODUCT_SELECT,
      },
    });

    if (!quickOrder) {
      throw new NotFoundException(QUICK_ORDER_MESSAGES.NOT_FOUND);
    }

    return quickOrder;
  }

  async save(quickOrder: QuickOrder): Promise<QuickOrder> {
    return this.repository.save(quickOrder);
  }

  async remove(quickOrder: QuickOrder): Promise<QuickOrder> {
    return this.repository.remove(quickOrder);
  }
}
