import { Injectable } from '@nestjs/common';
import {
  resolvePagination,
  toListResponse,
} from '../../../../core/response/helpers/list-response.helpers';
import { ListUsersByShopQueryDto } from '../../dto/list-users-by-shop-query.dto';
import { UserWithOrders, UsersByShopResponse } from '../../models/users.models';
import { UsersRepository } from '../../repositories/users/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUsersByShop(
    query: ListUsersByShopQueryDto,
  ): Promise<UsersByShopResponse> {
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } = await this.usersRepository.findUsersByShopId(
      query.shopId,
      skip,
      limit,
      query.email,
      query.phoneNumber,
      query.sortOrder,
    );

    return toListResponse(items, total, page, limit);
  }

  async getUserDetails(id: string): Promise<UserWithOrders> {
    return this.usersRepository.findUserDetailsById(id);
  }
}
