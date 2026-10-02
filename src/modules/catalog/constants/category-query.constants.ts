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

/**
 * The same subtree for several roots at once, for a listing narrowed to a
 * selection of categories rather than to a single one. Parameter
 * `:...categoryIds` is bound by the caller.
 */
export const CATEGORY_SUBTREES_CTE = `WITH RECURSIVE category_subtree AS (
  SELECT root.id
  FROM categories root
  WHERE root.id IN (:...categoryIds)
  UNION
  SELECT child.id
  FROM categories child
  INNER JOIN category_subtree parent ON child.parent_id = parent.id
)`;

export const CATEGORY_SUBTREE_IDS = `SELECT id FROM category_subtree`;

/** Self-contained subquery: the CTE plus its select, usable in an `IN (...)`. */
export const CATEGORY_SUBTREE_IDS_SUBQUERY = `${CATEGORY_SUBTREE_CTE} ${CATEGORY_SUBTREE_IDS}`;

export const CATEGORY_SUBTREES_IDS_SUBQUERY = `${CATEGORY_SUBTREES_CTE} ${CATEGORY_SUBTREE_IDS}`;

/** `categoryIds=a,b` is accepted next to the repeated parameter. */
export const CATEGORY_ID_SEPARATOR = ',';
