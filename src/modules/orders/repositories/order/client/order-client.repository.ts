import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../../../../catalog/entities/product.entity';
import { OrderProduct } from '../../../entities/order-product.entity';
import { Order } from '../../../entities/order.entity';
import { OrderQueryRepository } from '../common/order-query.repository';

@Injectable()
export class OrderClientRepository extends OrderQueryRepository {
  constructor(
    @InjectRepository(Order)
    repository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly itemRepository: Repository<OrderProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(repository);
  }

  create(payload: Partial<Order>): Order {
    return this.repository.create(payload);
  }

  async replaceItems(
    orderId: string,
    items: Array<{ productId: string; unitPrice: number; quantity: number }>,
  ): Promise<OrderProduct[]> {
    await this.itemRepository.delete({ orderId });

    if (items.length === 0) {
      return [];
    }

    const entities = items.map((item) =>
      this.itemRepository.create({
        orderId,
        productId: item.productId,
        unitPrice: String(item.unitPrice),
        quantity: item.quantity,
      }),
    );

    return this.itemRepository.save(entities);
  }

  async validateProductsForShop(
    shopId: string,
    productIds: string[],
  ): Promise<void> {
    const uniqueProductIds = Array.from(new Set(productIds));

    if (uniqueProductIds.length === 0) {
      return;
    }

    const existingProducts = await this.productRepository.find({
      where: {
        shopId,
        id: In(uniqueProductIds),
      },
      select: {
        id: true,
      },
    });

    const existingProductIds = new Set(
      existingProducts.map((product) => product.id),
    );
    const missingProductIds = uniqueProductIds.filter(
      (productId) => !existingProductIds.has(productId),
    );

    if (missingProductIds.length > 0) {
      throw new BadRequestException(
        `Невідомі ID продуктів для цього магазину: ${missingProductIds.join(', ')}`,
      );
    }
  }
}
