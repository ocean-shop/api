import { BadRequestException, Injectable } from '@nestjs/common';
import { QUICK_ORDER_MESSAGES } from '../../../constants/quick-order-messages.constants';
import { CreateQuickOrderDto } from '../../../dto/quick-orders/create-quick-order.dto';
import { QuickOrderStatus } from '../../../entities/enums/quick-order.enum';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrderClientRepository } from '../../../repositories/quick-order/client/quick-order-client.repository';

@Injectable()
export class QuickOrdersClientService {
  constructor(
    private readonly quickOrderClientRepository: QuickOrderClientRepository,
  ) {}

  async createQuickOrder(dto: CreateQuickOrderDto): Promise<QuickOrder> {
    await this.ensureProductInShop(dto.shopId, dto.productId);

    const quickOrder = this.quickOrderClientRepository.create({
      shopId: dto.shopId,
      productId: dto.productId,
      name: dto.name,
      phone: dto.phone,
      status: QuickOrderStatus.NEW,
    });

    return this.quickOrderClientRepository.save(quickOrder);
  }

  /** Gives a readable 400 instead of a foreign key violation from the DB. */
  private async ensureProductInShop(
    shopId: string,
    productId: string,
  ): Promise<void> {
    const exists = await this.quickOrderClientRepository.existsProductInShop(
      shopId,
      productId,
    );

    if (!exists) {
      throw new BadRequestException(QUICK_ORDER_MESSAGES.PRODUCT_NOT_FOUND);
    }
  }
}
