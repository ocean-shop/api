import { User } from '../entities/user.entity';

export type AdminListResponse = {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
