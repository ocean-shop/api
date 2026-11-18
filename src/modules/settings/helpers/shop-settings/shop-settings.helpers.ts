import { DEFAULT_COLOR_SCHEME } from '../../constants/shop-settings.constants';
import { ShopSettings } from '../../entities/shop-settings.entity';
import {
  ColorScheme,
  ColorSchemeOverrides,
  ColorSchemePatch,
  ColorToken,
  ShopSettingsResponse,
} from '../../models/shop-settings.models';

const COLOR_TOKENS = Object.keys(DEFAULT_COLOR_SCHEME) as ColorToken[];

const isColorToken = (key: string): key is ColorToken =>
  Object.hasOwn(DEFAULT_COLOR_SCHEME, key);

/**
 * Applies a patch to the stored overrides: a hex sets the token, `null` drops
 * the override so the default shows again, `undefined` leaves it alone.
 */
export const mergeColorScheme = (
  current: ColorSchemeOverrides,
  patch: ColorSchemePatch,
): ColorSchemeOverrides => {
  const next: ColorSchemeOverrides = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (!isColorToken(key) || value === undefined) {
      continue;
    }

    if (value === null) {
      delete next[key];
      continue;
    }

    next[key] = value.toLowerCase();
  }

  return next;
};

/**
 * Fills every token: stored overrides win, defaults cover the rest. Keys that
 * are no longer tokens (a retired token left in the DB) are ignored.
 */
export const resolveColorScheme = (
  overrides: ColorSchemeOverrides,
): ColorScheme => {
  const scheme: ColorScheme = { ...DEFAULT_COLOR_SCHEME };

  for (const token of COLOR_TOKENS) {
    const value = overrides[token];

    if (typeof value === 'string') {
      scheme[token] = value;
    }
  }

  return scheme;
};

export const toShopSettingsResponse = (
  settings: ShopSettings,
): ShopSettingsResponse => ({
  shopId: settings.shopId,
  useUkrposhta: settings.useUkrposhta,
  usePhoneLogin: settings.usePhoneLogin,
  useAutomaticPayment: settings.useAutomaticPayment,
  useOneClickPurchase: settings.useOneClickPurchase,
  colorScheme: resolveColorScheme(settings.colorScheme ?? {}),
  updatedAt: settings.updatedAt,
});
