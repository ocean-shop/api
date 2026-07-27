import { VariationTypeName } from '../entities/enums/variation-type.enum';
import { VariationType } from '../entities/variation-type.entity';

export type VariationTypeFilters = {
  name?: VariationTypeName;
  value?: string;
};

export type VariationTypeListResponse = {
  items: VariationType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
