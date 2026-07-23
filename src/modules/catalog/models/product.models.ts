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
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
