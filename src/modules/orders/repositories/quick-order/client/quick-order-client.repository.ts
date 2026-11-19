import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../../catalog/entities/product.entity';
import { QuickOrder } from '../../../entities/quick-order.entity';

@Injectable()
export class QuickOrderClientRepository {
  constructor(
    @InjectRepository(QuickOrder)
    private readonly repository: Repository<QuickOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async existsProductInShop(
    shopId: string,
    productId: string,
  ): Promise<boolean> {
    return this.productRepository.exists({ where: { id: productId, shopId } });
  }

  create(payload: Partial<QuickOrder>): QuickOrder {
    return this.repository.create(payload);
  }

  async save(quickOrder: QuickOrder): Promise<QuickOrder> {
    return this.repository.save(quickOrder);
  }
}
