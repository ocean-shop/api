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

export type CatalogProductFilters = {
  shopId: string;
  categoryId: string;
  attributes?: CatalogFilter[];
  priceFrom?: number;
  priceTo?: number;
  available?: boolean;
  sort?: CatalogProductSort;
};

export type ProductOrdering = {
  expression: string;
  direction: 'ASC' | 'DESC';
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
