import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { Role } from '../../entities/role.entity';
import { Shop } from '../../../catalog/entities/shop.entity';

describe('AdminsService', () => {
  let service: AdminsService;
  let userRepository: UserRepository;
  let roleRepository: { findOne: jest.Mock };
  let shopRepository: { find: jest.Mock };

  beforeEach(async () => {
    const userRepositoryMock = {
      findByRolesPaginated: jest.fn(),
      findByIdAndRoles: jest.fn(),
      findByEmail: jest.fn(),
      findByMobileNumber: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      countByRole: jest.fn(),
      remove: jest.fn(),
    };
    const roleRepositoryMock = {
      findOne: jest.fn(),
    };
    const shopRepositoryMock = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        { provide: UserRepository, useValue: userRepositoryMock },
        { provide: getRepositoryToken(Role), useValue: roleRepositoryMock },
        { provide: getRepositoryToken(Shop), useValue: shopRepositoryMock },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
    userRepository = module.get<UserRepository>(UserRepository);
    roleRepository = module.get(getRepositoryToken(Role));
    shopRepository = module.get(getRepositoryToken(Shop));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list admins with pagination', async () => {
    jest.mocked(userRepository.findByRolesPaginated).mockResolvedValue({
      items: [{ id: '1' }] as any,
      total: 1,
    });

    const result = await service.listAdmins({ page: 1, limit: 20 });

    expect(userRepository.findByRolesPaginated).toHaveBeenCalledWith(
      ['admin', 'super'],
      0,
      20,
    );
    expect(result.totalPages).toBe(1);
  });

  it('should create admin with default admin role', async () => {
    const role = { id: 'r1', name: 'admin' } as Role;
    const createdUser = { id: 'u1' };
    roleRepository.findOne.mockResolvedValue(role);
    jest.mocked(userRepository.findByEmail).mockResolvedValue(null);
    shopRepository.find.mockResolvedValue([]);
    jest.mocked(userRepository.create).mockReturnValue(createdUser as any);
    jest.mocked(userRepository.save).mockResolvedValue(createdUser as any);
    jest
      .mocked(userRepository.findByIdAndRoles)
      .mockResolvedValue(createdUser as any);

    const result = await service.createAdmin({ email: 'admin@example.com' });

    expect(roleRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'admin' },
    });
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ shops: [] }),
    );
    expect(userRepository.findByIdAndRoles).toHaveBeenCalledWith('u1', [
      'admin',
      'super',
    ]);
    expect(result).toEqual(createdUser);
  });

  it('should create admin with assigned shops', async () => {
    const role = { id: 'r1', name: 'admin' } as Role;
    const createdUser = { id: 'u1' };
    const shops = [{ id: 'shop-1' }, { id: 'shop-2' }] as any[];
    roleRepository.findOne.mockResolvedValue(role);
    jest.mocked(userRepository.findByEmail).mockResolvedValue(null);
    shopRepository.find.mockResolvedValue(shops);
    jest.mocked(userRepository.create).mockReturnValue(createdUser as any);
    jest.mocked(userRepository.save).mockResolvedValue(createdUser as any);
    jest
      .mocked(userRepository.findByIdAndRoles)
      .mockResolvedValue({ ...createdUser, shops } as any);

    const result = await service.createAdmin({
      email: 'admin@example.com',
      shopIds: ['shop-1', 'shop-2'],
    });

    expect(shopRepository.find).toHaveBeenCalledTimes(1);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ shops }),
    );
    expect(result).toEqual({ ...createdUser, shops });
  });

  it('should fail if email is already used', async () => {
    jest
      .mocked(userRepository.findByEmail)
      .mockResolvedValue({ id: 'existing' } as any);

    await expect(
      service.createAdmin({ email: 'admin@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should block self deletion', async () => {
    await expect(service.removeAdmin('u1', 'u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should replace assigned shops on update', async () => {
    const admin = {
      id: 'u1',
      role: { name: 'admin' },
      shops: [{ id: 'shop-old' }],
    } as any;
    const nextShops = [{ id: 'shop-new' }] as any[];
    jest
      .mocked(userRepository.findByIdAndRoles)
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce({ ...admin, shops: nextShops });
    shopRepository.find.mockResolvedValue(nextShops);
    jest.mocked(userRepository.save).mockResolvedValue({ id: 'u1' } as any);

    const result = await service.updateAdmin('u1', { shopIds: ['shop-new'] });

    expect(shopRepository.find).toHaveBeenCalledTimes(1);
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ shops: nextShops }),
    );
    expect(result).toEqual({ ...admin, shops: nextShops });
  });

  it('should clear assigned shops on update when shopIds is empty', async () => {
    const admin = {
      id: 'u1',
      role: { name: 'admin' },
      shops: [{ id: 'shop-old' }],
    } as any;
    jest
      .mocked(userRepository.findByIdAndRoles)
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce({ ...admin, shops: [] });
    jest.mocked(userRepository.save).mockResolvedValue({ id: 'u1' } as any);

    const result = await service.updateAdmin('u1', { shopIds: [] });

    expect(shopRepository.find).not.toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ shops: [] }),
    );
    expect(result).toEqual({ ...admin, shops: [] });
  });

  it('should fail if one of shop ids does not exist', async () => {
    const role = { id: 'r1', name: 'admin' } as Role;
    roleRepository.findOne.mockResolvedValue(role);
    jest.mocked(userRepository.findByEmail).mockResolvedValue(null);
    shopRepository.find.mockResolvedValue([{ id: 'shop-1' }] as any[]);

    await expect(
      service.createAdmin({
        email: 'admin@example.com',
        shopIds: ['shop-1', 'shop-2'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
