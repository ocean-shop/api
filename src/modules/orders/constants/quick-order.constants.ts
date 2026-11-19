/** Matches quick_orders.name VARCHAR(100). */
export const QUICK_ORDER_NAME_MAX_LENGTH = 100;

/** Upper bound for the admin search term (name or phone). */
export const QUICK_ORDER_SEARCH_MAX_LENGTH = 100;

/** Product fields returned with a quick order, enough for the admin to identify it. */
export const QUICK_ORDER_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
} as const;
