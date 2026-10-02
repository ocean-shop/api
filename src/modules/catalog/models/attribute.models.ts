import { Attribute } from '../entities/attribute.entity';

/** One filterable value of an attribute, as the catalog filter lists read it. */
export type AttributeFilterOption = {
  name: string;
  value: string;
};

export type AttributeListResponse = {
  items: Attribute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
