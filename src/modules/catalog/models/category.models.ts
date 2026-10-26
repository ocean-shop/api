import { Category } from '../entities/category.entity';
import { ListResponse } from '../../../core/response/models/response.models';

export type CategoryFilters = {
  shopId?: string;
  parentId?: string;
};

export type CategoryListResponse = ListResponse<Category>;

/**
 * A category a listing can be narrowed to: enough to render the entry and link
 * it to `by-category/{categoryId}`, with `parentId` so the storefront can group
 * the entries under their parent instead of asking for the tree again.
 */
export type CatalogCategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};
