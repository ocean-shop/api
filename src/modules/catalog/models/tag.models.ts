import { Tag } from '../entities/tag.entity';

export type TagFilters = {
  shopId?: string;
  name?: string;
};

export type TagListResponse = {
  items: Tag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
