import { Injectable } from '@nestjs/common';
import {
  resolvePagination,
  toListResponse,
} from '../../../../../core/response/helpers/list-response/list-response.helpers';
import { MessageResponse } from '../../../../../core/response/models/response.models';
import { QUICK_ORDER_MESSAGES } from '../../../constants/quick-order-messages.constants';
import { ListQuickOrdersQueryDto } from '../../../dto/quick-orders/list-quick-orders-query.dto';
import { UpdateQuickOrderDto } from '../../../dto/quick-orders/update-quick-order.dto';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrdersListResponse } from '../../../models/quick-order.models';
import { QuickOrderRepository } from '../../../repositories/quick-order/admin/quick-order.repository';

@Injectable()
export class QuickOrdersService {
  constructor(private readonly quickOrderRepository: QuickOrderRepository) {}

  async listQuickOrders(
    query: ListQuickOrdersQueryDto,
  ): Promise<QuickOrdersListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const filters = {
      shopId: query.shopId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { search: query.search } : {}),
      ...(query.sortOrder ? { sortOrder: query.sortOrder } : {}),
    };

    const { items, total } = await this.quickOrderRepository.findAllPaginated(
      filters,
      skip,
      limit,
    );

    return toListResponse(items, total, page, limit);
  }

  async getQuickOrderById(id: string): Promise<QuickOrder> {
    return this.quickOrderRepository.findById(id);
  }

  async updateQuickOrder(
    id: string,
    dto: UpdateQuickOrderDto,
  ): Promise<QuickOrder> {
    const quickOrder = await this.quickOrderRepository.findById(id);

    if (dto.name !== undefined) {
      quickOrder.name = dto.name;
    }

    if (dto.phone !== undefined) {
      quickOrder.phone = dto.phone;
    }

    if (dto.status !== undefined) {
      quickOrder.status = dto.status;
    }

    return this.quickOrderRepository.save(quickOrder);
  }

  async removeQuickOrder(id: string): Promise<MessageResponse> {
    const quickOrder = await this.quickOrderRepository.findById(id);
    await this.quickOrderRepository.remove(quickOrder);

    return { message: QUICK_ORDER_MESSAGES.REMOVED };
  }
}
