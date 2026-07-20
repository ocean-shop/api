import { Attribute } from '../entities/attribute.entity';

export type AttributeListResponse = {
  items: Attribute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
