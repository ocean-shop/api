import { DEFAULT_COLOR_SCHEME } from '../../constants/shop-settings.constants';
import { ShopSettings } from '../../entities/shop-settings.entity';
import {
  mergeColorScheme,
  resolveColorScheme,
  toShopSettingsResponse,
} from './shop-settings.helpers';

describe('shop-settings helpers', () => {
  describe('mergeColorScheme', () => {
    it('should set, lowercase and keep tokens', () => {
      const result = mergeColorScheme(
        { accent: '#111111' },
        { foreground: '#ABCDEF' },
      );

      expect(result).toEqual({ accent: '#111111', foreground: '#abcdef' });
    });

    it('should drop an override when the patch value is null', () => {
      const result = mergeColorScheme(
        { accent: '#111111', muted: '#222222' },
        { accent: null },
      );

      expect(result).toEqual({ muted: '#222222' });
    });

    it('should skip undefined values and unknown keys', () => {
      const patch = { accent: undefined, unknown: '#000000' } as never;

      const result = mergeColorScheme({ accent: '#111111' }, patch);

      expect(result).toEqual({ accent: '#111111' });
    });

    it('should not mutate the current overrides', () => {
      const current = { accent: '#111111' };

      mergeColorScheme(current, { accent: '#222222' });

      expect(current).toEqual({ accent: '#111111' });
    });
  });

  describe('resolveColorScheme', () => {
    it('should return defaults when nothing is overridden', () => {
      expect(resolveColorScheme({})).toEqual(DEFAULT_COLOR_SCHEME);
    });

    it('should apply overrides and ignore retired tokens', () => {
      const overrides = { accent: '#123456', retired: '#000000' } as never;

      const result = resolveColorScheme(overrides);

      expect(result).toEqual({ ...DEFAULT_COLOR_SCHEME, accent: '#123456' });
      expect(result).not.toHaveProperty('retired');
    });
  });

  describe('toShopSettingsResponse', () => {
    it('should map the entity with a resolved color scheme', () => {
      const updatedAt = new Date('2026-11-18T10:00:00.000Z');
      const settings = {
        shopId: 'shop-1',
        useUkrposhta: true,
        usePhoneLogin: false,
        useAutomaticPayment: true,
        useOneClickPurchase: false,
        colorScheme: { accent: '#123456' },
        createdAt: updatedAt,
        updatedAt,
      } as ShopSettings;

      expect(toShopSettingsResponse(settings)).toEqual({
        shopId: 'shop-1',
        useUkrposhta: true,
        usePhoneLogin: false,
        useAutomaticPayment: true,
        useOneClickPurchase: false,
        colorScheme: { ...DEFAULT_COLOR_SCHEME, accent: '#123456' },
        updatedAt,
      });
    });

    it('should fall back to defaults when the color scheme is missing', () => {
      const settings = { shopId: 'shop-1', colorScheme: null } as never;

      expect(toShopSettingsResponse(settings).colorScheme).toEqual(
        DEFAULT_COLOR_SCHEME,
      );
    });
  });
});
