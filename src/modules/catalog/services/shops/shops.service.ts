import { Injectable } from '@nestjs/common';
import { CreateShopDto } from '../../dto/create-shop.dto';
import { ListShopsQueryDto } from '../../dto/list-shops-query.dto';
import { UpdateShopDto } from '../../dto/update-shop.dto';
import { Shop } from '../../entities/shop.entity';
import { ShopListResponse } from '../../models/shop.models';
import { ShopRepository } from '../../repositories/shop/shop.repository';

@Injectable()
export class ShopsService {
  constructor(private readonly shopRepository: ShopRepository) {}

  async listShops(query: ListShopsQueryDto): Promise<ShopListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } = await this.shopRepository.findAllPaginated(
      skip,
      limit,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async getShopById(id: string): Promise<Shop> {
    return this.shopRepository.findById(id);
  }

  async createShop(dto: CreateShopDto): Promise<Shop> {
    const shop = this.shopRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      url: dto.url ?? null,
    });

    return this.shopRepository.save(shop);
  }

  async updateShop(id: string, dto: UpdateShopDto): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);

    if (dto.name !== undefined) {
      shop.name = dto.name;
    }
    if (dto.description !== undefined) {
      shop.description = dto.description;
    }
    if (dto.url !== undefined) {
      shop.url = dto.url;
    }

    return this.shopRepository.save(shop);
  }

  async removeShop(id: string): Promise<{ message: string }> {
    const shop = await this.shopRepository.findById(id);
    await this.shopRepository.remove(shop);
    return { message: 'Shop removed successfully' };
  }
}
