import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
  ): Promise<{ items: UserWithOrders[]; total: number }> {
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        'users_shops',
        'usersShops',
        'usersShops.user_id = user.id AND usersShops.shop_id = :shopId',
        { shopId },
      )
      .innerJoin('user.role', 'role', 'role.name = :roleName', {
        roleName: 'user',
      });

    if (email) {
      baseQuery.andWhere('user.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    if (phoneNumber) {
      baseQuery.andWhere('user.mobileNumber ILIKE :phoneNumber', {
        phoneNumber: `%${phoneNumber}%`,
      });
    }

    const total = await baseQuery
      .clone()
      .select('user.id')
      .distinct(true)
      .getCount();
    if (total === 0) {
      return { items: [], total: 0 };
    }

    const userIdsRows = await baseQuery
      .clone()
      .select('user.id', 'id')
      .distinct(true)
      .orderBy('user.createdAt', sortOrder === 'asc' ? 'ASC' : 'DESC')
      .skip(skip)
      .take(take)
      .getRawMany<{ id: string }>();

    const userIds = userIdsRows.map((row) => row.id);
    if (userIds.length === 0) {
      return { items: [], total };
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      relations: {
        role: true,
        sessions: true,
        otps: true,
      },
    });

    const orders = await this.orderRepository.find({
      where: {
        shopId,
        userId: In(userIds),
      },
      order: { createdAt: 'DESC' },
    });

    const ordersByUserId = new Map<string, Order[]>();
    for (const order of orders) {
      const existing = ordersByUserId.get(order.userId);
      if (existing) {
        existing.push(order);
      } else {
        ordersByUserId.set(order.userId, [order]);
      }
    }

    const usersById = new Map(users.map((user) => [user.id, user]));
    const items: UserWithOrders[] = userIds
      .map((userId) => {
        const user = usersById.get(userId);
        if (!user) {
          return null;
        }

        return {
          ...user,
          orders: ordersByUserId.get(userId) ?? [],
        };
      })
      .filter((user): user is UserWithOrders => !!user);

    return { items, total };
  }
}
