import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../../../../../core/cache/cache.service';
import { POSTGRES_ERROR_CODES } from '../../../../../core/db/constants/postgres-error.constants';
import { matchesQueryFailedError } from '../../../../../core/db/helpers/query-failed-error/query-failed-error.helpers';
import { SHOP_SETTINGS_CONSTRAINTS } from '../../../constants/shop-settings-constraint.constants';
import { SHOP_SETTINGS_MESSAGES } from '../../../constants/shop-settings-messages.constants';
import { UpdateShopSettingsDto } from '../../../dto/shop-settings/update-shop-settings.dto';
import { ShopSettings } from '../../../entities/shop-settings.entity';
import {
  mergeColorScheme,
  toShopSettingsResponse,
} from '../../../helpers/shop-settings/shop-settings.helpers';
import { ShopSettingsResponse } from '../../../models/shop-settings.models';
import { ShopSettingsRepository } from '../../../repositories/shop-settings/shop-settings.repository';

@Injectable()
export class ShopSettingsService {
  constructor(
    private readonly shopSettingsRepository: ShopSettingsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getShopSettings(shopId: string): Promise<ShopSettingsResponse> {
    const settings = await this.findOrCreateSettings(shopId);

    return toShopSettingsResponse(settings);
  }

  async updateShopSettings(
    shopId: string,
    dto: UpdateShopSettingsDto,
  ): Promise<ShopSettingsResponse> {
    const settings = await this.findOrCreateSettings(shopId);

    if (dto.useUkrposhta !== undefined) {
      settings.useUkrposhta = dto.useUkrposhta;
    }

    if (dto.usePhoneLogin !== undefined) {
      settings.usePhoneLogin = dto.usePhoneLogin;
    }

    if (dto.useAutomaticPayment !== undefined) {
      settings.useAutomaticPayment = dto.useAutomaticPayment;
    }

    if (dto.useOneClickPurchase !== undefined) {
      settings.useOneClickPurchase = dto.useOneClickPurchase;
    }

    if (dto.colorScheme) {
      settings.colorScheme = mergeColorScheme(
        settings.colorScheme ?? {},
        dto.colorScheme,
      );
    }

    const saved = await this.shopSettingsRepository.save(settings);
    await this.cacheService.invalidate(shopId);

    return toShopSettingsResponse(saved);
  }

  /**
   * Settings rows are created on first access, so shops that existed before
   * the table (or were created without settings) get defaults transparently.
   */
  private async findOrCreateSettings(shopId: string): Promise<ShopSettings> {
    const existing = await this.shopSettingsRepository.findByShopId(shopId);

    if (existing) {
      return existing;
    }

    try {
      return await this.shopSettingsRepository.createDefault(shopId);
    } catch (error) {
      return this.rethrowConstraintError(error);
    }
  }

  private rethrowConstraintError(error: unknown): never {
    if (
      matchesQueryFailedError(error, {
        code: POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION,
        constraint: SHOP_SETTINGS_CONSTRAINTS.SHOP_FK,
      })
    ) {
      throw new NotFoundException(SHOP_SETTINGS_MESSAGES.SHOP_NOT_FOUND);
    }

    throw error;
  }
}
