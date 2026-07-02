import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { UserRepository } from '../../repositories/user/user.repository';
import { Role } from '../../entities/role.entity';

describe('AdminsService', () => {
  let service: AdminsService;
  let userRepository: UserRepository;
  let roleRepository: { findOne: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        { provide: UserRepository, useValue: userRepositoryMock },
        { provide: getRepositoryToken(Role), useValue: roleRepositoryMock },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
    userRepository = module.get<UserRepository>(UserRepository);
    roleRepository = module.get(getRepositoryToken(Role));
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
    jest.mocked(userRepository.create).mockReturnValue(createdUser as any);
    jest.mocked(userRepository.save).mockResolvedValue(createdUser as any);

    const result = await service.createAdmin({ email: 'admin@example.com' });

    expect(roleRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'admin' },
    });
    expect(userRepository.create).toHaveBeenCalled();
    expect(result).toEqual(createdUser);
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
});
