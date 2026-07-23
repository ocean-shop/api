import { Category } from '../entities/category.entity';

export type CategoryFilters = {
  shopId?: string;
  parentId?: string;
};

export type CategoryListResponse = {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
