import {
  DEFAULT_PAGE,
  PAGINATION_MAX,
} from '../../constants/pagination.constants';
import {
  ListResponse,
  Pagination,
  PaginationQuery,
} from '../../models/response.models';

export function resolvePagination(query: PaginationQuery): Pagination {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? PAGINATION_MAX;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function toListResponse<TItem>(
  items: TItem[],
  total: number,
  page: number,
  limit: number,
): ListResponse<TItem> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
}
