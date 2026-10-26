import { Attribute } from '../entities/attribute.entity';
import { ListResponse } from '../../../core/response/models/response.models';

/** One filterable value of an attribute, as the catalog filter lists read it. */
export type AttributeFilterOption = {
  name: string;
  value: string;
};

export type AttributeListResponse = ListResponse<Attribute>;
