import {
  ListResponse,
  SortOrder,
} from '../../../core/response/models/response.models';
import { QuickOrderStatus } from '../entities/enums/quick-order.enum';
import { QuickOrder } from '../entities/quick-order.entity';

export type QuickOrderFilters = {
  shopId: string;
  status?: QuickOrderStatus;
  search?: string;
  sortOrder?: SortOrder;
};

export type QuickOrdersListResponse = ListResponse<QuickOrder>;
