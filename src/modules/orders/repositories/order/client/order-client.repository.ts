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

  // Assigns the next sequential order number within the shop. The advisory
  // lock serialises concurrent order creation per shop so numbers never clash.
  async saveWithNextOrderNumber(order: Order): Promise<Order> {
    return this.repository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        order.shopId,
      ]);

      const result = await manager
        .createQueryBuilder(Order, 'order')
        .select(
          `COALESCE(MAX(CASE WHEN "order"."order_number" ~ '^[0-9]+$' THEN "order"."order_number"::bigint END), 0)`,
          'lastOrderNumber',
        )
        .where('order.shopId = :shopId', { shopId: order.shopId })
        .getRawOne<{ lastOrderNumber: string }>();

      order.orderNumber = String(Number(result?.lastOrderNumber ?? 0) + 1);

      return manager.save(Order, order);
    });
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

  async findProductImageUrls(
    productIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueProductIds = Array.from(new Set(productIds));

    if (uniqueProductIds.length === 0) {
      return new Map();
    }

    const products = await this.productRepository.find({
      where: { id: In(uniqueProductIds) },
      relations: { images: true },
      select: { id: true, images: { url: true, sort: true } },
    });

    const imageUrls = new Map<string, string>();
    for (const product of products) {
      const [firstImage] = [...(product.images ?? [])].sort(
        (a, b) => a.sort - b.sort,
      );
      if (firstImage) {
        imageUrls.set(product.id, firstImage.url);
      }
    }

    return imageUrls;
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
