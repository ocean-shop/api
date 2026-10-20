import { SORT_ORDERS } from '../constants/sort.constants';

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

/** One page as a repository reads it: the rows plus the count of every match. */
export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
};

export type ListResponse<TItem> = PaginatedResult<TItem> &
  Pick<Pagination, 'page' | 'limit'> & {
    totalPages: number;
  };

export type MessageResponse = {
  message: string;
};

export type SortOrder = (typeof SORT_ORDERS)[number];
