import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Product } from '../../../catalog/entities/product.entity';
import { OrderProduct } from '../../entities/order-product.entity';
import { Order } from '../../entities/order.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly itemRepository: Repository<OrderProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

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

  async findById(id: string): Promise<Order> {
    const order = await this.repository.findOne({
      where: { id },
      relations: {
        items: {
          product: true,
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  create(payload: Partial<Order>): Order {
    return this.repository.create(payload);
  }

  async save(order: Order): Promise<Order> {
    return this.repository.save(order);
  }

  async remove(order: Order): Promise<Order> {
    return this.repository.remove(order);
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
        `Unknown product IDs for this shop: ${missingProductIds.join(', ')}`,
      );
    }
  }
}
