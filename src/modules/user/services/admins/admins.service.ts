import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAdminDto } from '../../dto/create-admin.dto';
import { ListAdminsQueryDto } from '../../dto/list-admins-query.dto';
import { UpdateAdminDto } from '../../dto/update-admin.dto';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { AdminListResponse } from '../../models/admin.models';

@Injectable()
export class AdminsService {
  private readonly adminRoleNames = ['admin', 'super'];

  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async listAdmins(query: ListAdminsQueryDto): Promise<AdminListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const { items, total } = await this.userRepository.findByRolesPaginated(
      this.adminRoleNames,
      skip,
      limit,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async getAdminById(id: string): Promise<User> {
    return this.userRepository.findByIdAndRoles(id, this.adminRoleNames);
  }

  async createAdmin(dto: CreateAdminDto): Promise<User> {
    await this.ensureUniqueIdentity(dto.email, dto.mobileNumber);

    const roleName = dto.role ?? 'admin';
    const role = await this.findRoleByName(roleName);

    const admin = this.userRepository.create({
      email: dto.email ?? null,
      mobileNumber: dto.mobileNumber ?? null,
      isActive: dto.isActive ?? true,
      isEmailVerified: !!dto.email,
      isMobileVerified: !!dto.mobileNumber,
      role,
    });

    return this.userRepository.save(admin);
  }

  async updateAdmin(
    id: string,
    dto: UpdateAdminDto,
    actorId?: string,
  ): Promise<User> {
    const admin = await this.userRepository.findByIdAndRoles(
      id,
      this.adminRoleNames,
    );

    await this.applyEmailUpdate(id, dto.email, admin);
    await this.applyMobileNumberUpdate(id, dto.mobileNumber, admin);
    this.applyIsActiveUpdate(dto.isActive, admin);
    await this.applyRoleUpdate(id, dto.role, admin, actorId);

    return this.userRepository.save(admin);
  }

  async removeAdmin(
    id: string,
    actorId?: string,
  ): Promise<{ message: string }> {
    if (actorId && actorId === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const admin = await this.userRepository.findByIdAndRoles(
      id,
      this.adminRoleNames,
    );

    if (admin.role?.name === 'super') {
      await this.ensureSuperUserCanBeChanged();
    }

    await this.userRepository.remove(admin);

    return { message: 'Admin user removed successfully' };
  }

  private async ensureUniqueIdentity(
    email?: string,
    mobileNumber?: string,
  ): Promise<void> {
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new BadRequestException('Email is already in use');
      }
    }

    if (mobileNumber) {
      const existingByMobile =
        await this.userRepository.findByMobileNumber(mobileNumber);
      if (existingByMobile) {
        throw new BadRequestException('Mobile number is already in use');
      }
    }
  }

  private async applyEmailUpdate(
    adminId: string,
    email: string | undefined,
    admin: User,
  ): Promise<void> {
    if (!email || email === admin.email) {
      return;
    }

    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail && existingByEmail.id !== adminId) {
      throw new BadRequestException('Email is already in use');
    }

    admin.email = email;
  }

  private async applyMobileNumberUpdate(
    adminId: string,
    mobileNumber: string | undefined,
    admin: User,
  ): Promise<void> {
    if (!mobileNumber || mobileNumber === admin.mobileNumber) {
      return;
    }

    const existingByMobile =
      await this.userRepository.findByMobileNumber(mobileNumber);
    if (existingByMobile && existingByMobile.id !== adminId) {
      throw new BadRequestException('Mobile number is already in use');
    }

    admin.mobileNumber = mobileNumber;
  }

  private applyIsActiveUpdate(
    isActive: boolean | undefined,
    admin: User,
  ): void {
    if (isActive !== undefined) {
      admin.isActive = isActive;
    }
  }

  private async applyRoleUpdate(
    adminId: string,
    nextRole: 'admin' | 'super' | undefined,
    admin: User,
    actorId?: string,
  ): Promise<void> {
    if (!nextRole || nextRole === admin.role?.name) {
      return;
    }

    if (actorId && actorId === adminId && nextRole === 'admin') {
      throw new ForbiddenException('You cannot demote your own super account');
    }

    if (admin.role?.name === 'super' && nextRole !== 'super') {
      await this.ensureSuperUserCanBeChanged();
    }

    admin.role = await this.findRoleByName(nextRole);
  }

  private async findRoleByName(roleName: 'admin' | 'super'): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new BadRequestException(`Role ${roleName} is not configured`);
    }
    return role;
  }

  private async ensureSuperUserCanBeChanged(): Promise<void> {
    const superUsersCount = await this.userRepository.countByRole('super');
    if (superUsersCount <= 1) {
      throw new BadRequestException('Cannot modify the last super user');
    }
  }
}
