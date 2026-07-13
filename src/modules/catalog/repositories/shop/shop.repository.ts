import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../../entities/shop.entity';

@Injectable()
export class ShopRepository {
  constructor(
    @InjectRepository(Shop)
    private readonly repository: Repository<Shop>,
  ) {}

  async findAllPaginated(
    skip: number,
    take: number,
  ): Promise<{ items: Shop[]; total: number }> {
    const [items, total] = await this.repository
      .createQueryBuilder('shop')
      .orderBy('shop.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<Shop> {
    const shop = await this.repository.findOne({ where: { id } });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  create(payload: Partial<Shop>): Shop {
    return this.repository.create(payload);
  }

  async save(shop: Shop): Promise<Shop> {
    return this.repository.save(shop);
  }

  async remove(shop: Shop): Promise<Shop> {
    return this.repository.remove(shop);
  }
}
