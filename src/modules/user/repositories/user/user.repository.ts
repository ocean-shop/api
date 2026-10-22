import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { USER_MESSAGES } from '../../constants/user-messages.constants';
import { UserAuthState } from '../../models/auth-request.models';
import { PaginatedResult } from '../../../../core/response/models/response.models';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmailOrPhone(email?: string, phone?: string): Promise<User> {
    const user = await this.repository.findOne({
      where: email ? { email } : { mobileNumber: phone },
      relations: {
        role: true,
        shops: true,
        otps: true,
      },
    });

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { id },
      relations: { role: true, shops: true },
    });

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.NOT_FOUND);
    }

    return user;
  }

  /** The current status and role, read fresh on every authenticated request. */
  async findAuthState(id: string): Promise<UserAuthState | null> {
    const user = await this.repository.findOne({
      where: { id },
      select: { id: true, isActive: true, role: { name: true } },
      relations: { role: true },
    });

    if (!user) {
      return null;
    }

    return { isActive: user.isActive, role: user.role?.name ?? null };
  }

  create(payload: Partial<User>): User {
    return this.repository.create(payload);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations: { role: true, shops: true },
    });
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    return this.repository.findOne({
      where: { mobileNumber },
      relations: { role: true, shops: true },
    });
  }

  async findByRolesPaginated(
    roles: string[],
    skip: number,
    take: number,
  ): Promise<PaginatedResult<User>> {
    const [items, total] = await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.shops', 'shop')
      .where('role.name IN (:...roles)', { roles })
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items, total };
  }

  async findByIdAndRoles(id: string, roles: string[]): Promise<User> {
    const user = await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.shops', 'shop')
      .where('user.id = :id', { id })
      .andWhere('role.name IN (:...roles)', { roles })
      .getOne();

    if (!user) {
      throw new NotFoundException(USER_MESSAGES.ADMIN_NOT_FOUND);
    }

    return user;
  }

  async countByRole(roleName: string): Promise<number> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName })
      .getCount();
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async remove(user: User): Promise<User> {
    return this.repository.remove(user);
  }
}
