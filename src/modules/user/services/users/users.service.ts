import { Injectable } from '@nestjs/common';
import { ListUsersByShopQueryDto } from '../../dto/list-users-by-shop-query.dto';
import { UsersByShopResponse } from '../../models/users.models';
import { UsersRepository } from '../../repositories/users/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUsersByShop(
    query: ListUsersByShopQueryDto,
  ): Promise<UsersByShopResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.usersRepository.findUsersByShopId(
      query.shopId,
      skip,
      limit,
      query.email,
      query.phoneNumber,
      query.sortOrder,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }
}
