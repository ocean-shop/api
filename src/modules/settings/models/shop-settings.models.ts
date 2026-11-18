import { DEFAULT_COLOR_SCHEME } from '../constants/shop-settings.constants';

export type ColorToken = keyof typeof DEFAULT_COLOR_SCHEME;

/** The full palette the storefront renders. */
export type ColorScheme = Record<ColorToken, string>;

/** What is stored per shop: only the overridden tokens. */
export type ColorSchemeOverrides = Partial<ColorScheme>;

/**
 * A color scheme update: a hex sets the token, `null` resets it to the default,
 * and a missing key leaves it unchanged.
 */
export type ColorSchemePatch = Partial<Record<ColorToken, string | null>>;

export type ShopSettingsResponse = {
  shopId: string;
  useUkrposhta: boolean;
  usePhoneLogin: boolean;
  useAutomaticPayment: boolean;
  useOneClickPurchase: boolean;
  colorScheme: ColorScheme;
  updatedAt: Date;
};
