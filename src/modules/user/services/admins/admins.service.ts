import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateAdminDto } from '../../dto/create-admin.dto';
import { ListAdminsQueryDto } from '../../dto/list-admins-query.dto';
import { UpdateAdminDto } from '../../dto/update-admin.dto';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user/user.repository';
import { AdminListResponse } from '../../models/admin.models';
import { Shop } from '../../../catalog/entities/shop.entity';
import {
  resolvePagination,
  toListResponse,
} from '../../../../core/response/helpers/list-response/list-response.helpers';
import { MessageResponse } from '../../../../core/response/models/response.models';
import { AUTH_MESSAGES } from '../../constants/auth-messages.constants';
import { ADMIN_ROLES, ROLES } from '../../constants/role.constants';
import { USER_MESSAGES } from '../../constants/user-messages.constants';
import { AdminRoleName } from '../../models/role.models';
import { UserSessionService } from '../user-session/user-session.service';

@Injectable()
export class AdminsService {
  private readonly adminRoleNames = [...ADMIN_ROLES];

  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
    private readonly userSessionService: UserSessionService,
  ) {}

  async listAdmins(query: ListAdminsQueryDto): Promise<AdminListResponse> {
    const { page, limit, skip } = resolvePagination(query);
    const { items, total } = await this.userRepository.findByRolesPaginated(
      this.adminRoleNames,
      skip,
      limit,
    );

    return toListResponse(items, total, page, limit);
  }

  async getAdminById(id: string): Promise<User> {
    return this.userRepository.findByIdAndRoles(id, this.adminRoleNames);
  }

  async createAdmin(dto: CreateAdminDto): Promise<User> {
    await this.ensureUniqueIdentity(dto.email, dto.mobileNumber);

    const roleName = dto.role ?? ROLES.ADMIN;
    const role = await this.findRoleByName(roleName);
    const shops = await this.resolveShopsByIds(dto.shopIds ?? []);

    const admin = this.userRepository.create({
      email: dto.email ?? null,
      mobileNumber: dto.mobileNumber ?? null,
      isActive: dto.isActive ?? true,
      isEmailVerified: !!dto.email,
      isMobileVerified: !!dto.mobileNumber,
      role,
      shops,
    });

    const savedAdmin = await this.userRepository.save(admin);
    return this.getAdminById(savedAdmin.id);
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
    await this.applyShopsUpdate(dto.shopIds, admin);

    const savedAdmin = await this.userRepository.save(admin);
    if (dto.isActive === false) {
      await this.userSessionService.revokeAllSessions(id);
    }

    return this.getAdminById(savedAdmin.id);
  }

  async removeAdmin(id: string, actorId?: string): Promise<MessageResponse> {
    if (actorId && actorId === id) {
      throw new ForbiddenException(USER_MESSAGES.CANNOT_REMOVE_SELF);
    }

    const admin = await this.userRepository.findByIdAndRoles(
      id,
      this.adminRoleNames,
    );

    if (admin.role?.name === ROLES.SUPER) {
      await this.ensureSuperUserCanBeChanged();
    }

    await this.userRepository.remove(admin);

    return { message: USER_MESSAGES.ADMIN_REMOVED };
  }

  private async ensureUniqueIdentity(
    email?: string,
    mobileNumber?: string,
  ): Promise<void> {
    if (email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail) {
        throw new BadRequestException(USER_MESSAGES.EMAIL_TAKEN);
      }
    }

    if (mobileNumber) {
      const existingByMobile =
        await this.userRepository.findByMobileNumber(mobileNumber);
      if (existingByMobile) {
        throw new BadRequestException(USER_MESSAGES.PHONE_TAKEN);
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
      throw new BadRequestException(USER_MESSAGES.EMAIL_TAKEN);
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
      throw new BadRequestException(USER_MESSAGES.PHONE_TAKEN);
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
    nextRole: AdminRoleName | undefined,
    admin: User,
    actorId?: string,
  ): Promise<void> {
    if (!nextRole || nextRole === admin.role?.name) {
      return;
    }

    if (actorId && actorId === adminId && nextRole === ROLES.ADMIN) {
      throw new ForbiddenException(USER_MESSAGES.CANNOT_DEMOTE_SELF);
    }

    if (admin.role?.name === ROLES.SUPER && nextRole !== ROLES.SUPER) {
      await this.ensureSuperUserCanBeChanged();
    }

    admin.role = await this.findRoleByName(nextRole);
  }

  private async applyShopsUpdate(
    shopIds: string[] | undefined,
    admin: User,
  ): Promise<void> {
    if (shopIds === undefined) {
      return;
    }

    admin.shops = await this.resolveShopsByIds(shopIds);
  }

  private async resolveShopsByIds(shopIds: string[]): Promise<Shop[]> {
    const uniqueShopIds = [...new Set(shopIds)];
    if (uniqueShopIds.length === 0) {
      return [];
    }

    const shops = await this.shopRepository.find({
      where: { id: In(uniqueShopIds) },
    });

    if (shops.length !== uniqueShopIds.length) {
      const existingShopIds = new Set(shops.map((shop) => shop.id));
      const missingShopIds = uniqueShopIds.filter(
        (id) => !existingShopIds.has(id),
      );
      throw new BadRequestException(USER_MESSAGES.missingShops(missingShopIds));
    }

    return shops;
  }

  private async findRoleByName(roleName: AdminRoleName): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new BadRequestException(AUTH_MESSAGES.roleNotConfigured(roleName));
    }
    return role;
  }

  private async ensureSuperUserCanBeChanged(): Promise<void> {
    const superUsersCount = await this.userRepository.countByRole(ROLES.SUPER);
    if (superUsersCount <= 1) {
      throw new BadRequestException(USER_MESSAGES.LAST_SUPER_USER);
    }
  }
}
