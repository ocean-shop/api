import { ProductStatus } from '../entities/enums/product.enum';
import { Product } from '../entities/product.entity';

export type ProductFilters = {
  shopId?: string;
  status?: ProductStatus;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
