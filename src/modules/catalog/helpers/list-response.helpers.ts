import { PAGINATION_MAX } from '../constants/pagination.constants';

export function resolvePagination(query: { page?: number; limit?: number }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = query.page ?? 1;
  const limit = query.limit ?? PAGINATION_MAX;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function toListResponse<TItem>(
  items: TItem[],
  total: number,
  page: number,
  limit: number,
): {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  return {
    items,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
}
