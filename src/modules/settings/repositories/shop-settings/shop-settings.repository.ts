import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopSettings } from '../../entities/shop-settings.entity';

@Injectable()
export class ShopSettingsRepository {
  constructor(
    @InjectRepository(ShopSettings)
    private readonly repository: Repository<ShopSettings>,
  ) {}

  async findByShopId(shopId: string): Promise<ShopSettings | null> {
    return this.repository.findOne({ where: { shopId } });
  }

  /**
   * Inserts the default row and returns it. `orIgnore` makes two concurrent
   * first reads safe: the loser skips the insert and reads the winner's row.
   * A missing shop surfaces as a foreign key violation for the service to map.
   */
  async createDefault(shopId: string): Promise<ShopSettings> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(ShopSettings)
      .values({ shopId })
      .orIgnore()
      .execute();

    return this.repository.findOneOrFail({ where: { shopId } });
  }

  async save(settings: ShopSettings): Promise<ShopSettings> {
    return this.repository.save(settings);
  }
}
