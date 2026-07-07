import { Shop } from '../entities/shop.entity';

export type ShopListResponse = {
  items: Shop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
