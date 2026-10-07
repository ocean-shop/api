import { UpdateOrderPaymentStatusDto } from '../../../dto/update-order-payment-status.dto';
import { UpdateOrderStatusDto } from '../../../dto/update-order-status.dto';
import { Order } from '../../../entities/order.entity';
import { OrderQueryRepository } from '../../../repositories/order/common/order-query.repository';

export abstract class OrdersStatusService {
  protected constructor(
    protected readonly orderQueryRepository: OrderQueryRepository,
  ) {}

  async updatePaymentStatus(
    id: string,
    dto: UpdateOrderPaymentStatusDto,
  ): Promise<Order> {
    const order = await this.orderQueryRepository.findById(id);
    order.paymentStatus = dto.paymentStatus;
    return this.orderQueryRepository.save(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderQueryRepository.findById(id);
    order.status = dto.status;
    return this.orderQueryRepository.save(order);
  }
}
