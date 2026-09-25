/**
 * Ids of a category together with every category nested under it, so a parent
 * category lists the products and filters of its whole subtree.
 *
 * `UNION` instead of `UNION ALL` so a broken parent chain cannot loop forever.
 */
export const CATEGORY_SUBTREE_CTE = `WITH RECURSIVE category_subtree AS (
  SELECT root.id
  FROM categories root
  WHERE root.id = :categoryId
  UNION
  SELECT child.id
  FROM categories child
  INNER JOIN category_subtree parent ON child.parent_id = parent.id
)`;

export const CATEGORY_SUBTREE_IDS = `SELECT id FROM category_subtree`;

/** Self-contained subquery: the CTE plus its select, usable in an `IN (...)`. */
export const CATEGORY_SUBTREE_IDS_SUBQUERY = `${CATEGORY_SUBTREE_CTE} ${CATEGORY_SUBTREE_IDS}`;
