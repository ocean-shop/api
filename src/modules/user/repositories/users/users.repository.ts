import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../../../orders/entities/order.entity';
import { User } from '../../entities/user.entity';
import { UserWithOrders } from '../../models/users.models';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findUsersByShopId(
    shopId: string,
    skip: number,
    take: number,
    email?: string,
    phoneNumber?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: User[]; total: number }> {
    const baseQuery = this.buildUsersByShopQuery(shopId, email, phoneNumber);
    const total = await this.countUsers(baseQuery);
    if (total === 0) {
      return { items: [], total: 0 };
    }

    const userIds = await this.findPagedUserIds(
      baseQuery,
      skip,
      take,
      sortOrder,
    );
    if (userIds.length === 0) {
      return { items: [], total };
    }

    const items = await this.findUsersInSourceOrder(userIds);

    return { items, total };
  }

  private buildUsersByShopQuery(
    shopId: string,
    email?: string,
    phoneNumber?: string,
  ): SelectQueryBuilder<User> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        'users_shops',
        'users_shops',
        'users_shops.user_id = user.id AND users_shops.shop_id = :shopId',
        { shopId },
      )
      .innerJoin('user.role', 'role', 'role.name = :roleName', {
        roleName: 'user',
      });

    if (email) {
      query.andWhere('user.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (phoneNumber) {
      query.andWhere('user.mobileNumber ILIKE :phoneNumber', {
        phoneNumber: `%${phoneNumber}%`,
      });
    }

    return query;
  }

  private async countUsers(query: SelectQueryBuilder<User>): Promise<number> {
    return query.clone().select('user.id').distinct(true).getCount();
  }

  private async findPagedUserIds(
    query: SelectQueryBuilder<User>,
    skip: number,
    take: number,
    sortOrder: 'asc' | 'desc',
  ): Promise<string[]> {
    const rows = await query
      .clone()
      .select('user.id', 'id')
      .addSelect('user.createdAt', 'createdAt')
      .distinct(true)
      .orderBy('user.createdAt', sortOrder === 'asc' ? 'ASC' : 'DESC')
      .skip(skip)
      .take(take)
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }

  private async findUsersInSourceOrder(userIds: string[]): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });

    const usersById = new Map(users.map((user) => [user.id, user]));
    return userIds
      .map((userId) => usersById.get(userId))
      .filter((user): user is User => !!user);
  }

  async findUserDetailsById(id: string): Promise<UserWithOrders> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        role: true,
        sessions: true,
        otps: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    const orders = await this.orderRepository.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
    });

    return {
      ...user,
      orders,
    };
  }
}
