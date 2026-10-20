import { Tag } from '../entities/tag.entity';
import { ListResponse } from '../../../core/response/models/response.models';

export type TagFilters = {
  shopId?: string;
  name?: string;
};

export type TagListResponse = ListResponse<Tag>;
