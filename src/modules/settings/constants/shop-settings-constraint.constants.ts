export const SHOP_SETTINGS_CONSTRAINTS = {
  /** Violated when settings are created for a shop that does not exist. */
  SHOP_FK: 'fk_shop_settings_shop',
} as const;
