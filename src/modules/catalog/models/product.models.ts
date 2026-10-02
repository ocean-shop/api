import { ProductStatus } from '../entities/enums/product.enum';
import { Product } from '../entities/product.entity';

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
}

export enum ProductSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type ProductFilters = {
  shopId?: string;
  status?: ProductStatus;
  name?: string;
  sku?: string;
  categoryIds?: string[];
  isPopular?: boolean;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
};

export enum CatalogProductSort {
  POPULAR = 'popular',
  CHEAPER = 'cheaper',
  EXPENSIVE = 'expensive',
  NEW = 'new',
}

export type CatalogFilter = {
  name: string;
  values: string[];
};

/** Narrowing shared by every catalog listing, whatever selects the products. */
export type CommonCatalogProductFilters = {
  shopId: string;
  attributes?: CatalogFilter[];
  priceFrom?: number;
  priceTo?: number;
  available?: boolean;
  sort?: CatalogProductSort;
};

export type CatalogProductFilters = CommonCatalogProductFilters & {
  categoryId: string;
};

/** The search listing selects by a term where the catalog selects by category. */
export type CatalogProductSearchFilters = CommonCatalogProductFilters & {
  term: string;
};

export type ProductOrdering = {
  expression: string;
  direction: 'ASC' | 'DESC';
};

/** Everything a search suggestion needs: a card plus the id to redirect to. */
export type ProductSearchItem = {
  id: string;
  name: string;
  price: string;
  oldPrice: string | null;
  image: string | null;
};

export type ProductSearchResponse = {
  total: number;
  items: ProductSearchItem[];
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * A search page plus the filters the term can be narrowed by, so the storefront
 * renders the results and the filter panel from a single request. The category
 * page gets the same filters from `filters/by-category/:categoryId`, which it
 * can request once per category instead of once per page.
 */
export type ProductSearchListResponse = ProductListResponse & {
  filters: CatalogFilter[];
};
