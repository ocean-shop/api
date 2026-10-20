import { Injectable } from '@nestjs/common';
import { SHOP_MESSAGES } from '../../constants/shop-messages.constants';
import { CreateShopDto } from '../../dto/shops/create-shop.dto';
import { ListShopsQueryDto } from '../../dto/shops/list-shops-query.dto';
import { UpdateShopDto } from '../../dto/shops/update-shop.dto';
import { Shop } from '../../entities/shop.entity';
import {
  resolvePagination,
  toListResponse,
} from '../../../../core/response/helpers/list-response.helpers';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { ShopListResponse } from '../../models/shop.models';
import { ShopRepository } from '../../repositories/shop/shop.repository';

@Injectable()
export class ShopsService {
  constructor(private readonly shopRepository: ShopRepository) {}

  async listShops(query: ListShopsQueryDto): Promise<ShopListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const { items, total } = await this.shopRepository.findAllPaginated(
      skip,
      limit,
    );

    return toListResponse(items, total, page, limit);
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

  async removeShop(id: string): Promise<MessageResponse> {
    const shop = await this.shopRepository.findById(id);
    await this.shopRepository.remove(shop);
    return { message: SHOP_MESSAGES.REMOVED };
  }
}
