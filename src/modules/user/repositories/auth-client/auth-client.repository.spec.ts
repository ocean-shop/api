import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { Shop } from '../../../catalog/entities/shop.entity';
import { AuthClientRepository } from './auth-client.repository';

describe('AuthClientRepository', () => {
  let repository: AuthClientRepository;
  let userRepository: any;
  let roleRepository: any;
  let shopRepository: any;
  let insertQueryBuilder: any;

  beforeEach(async () => {
    insertQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn((payload) => payload),
      save: jest.fn((entity) => Promise.resolve({ id: 'user-1', ...entity })),
      createQueryBuilder: jest.fn(() => insertQueryBuilder),
    };
    roleRepository = { findOne: jest.fn() };
    shopRepository = { existsBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthClientRepository,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
        { provide: getRepositoryToken(Shop), useValue: shopRepository },
      ],
    }).compile();

    repository = module.get<AuthClientRepository>(AuthClientRepository);
  });

  it('should find a user by email with their role', async () => {
    const user = { id: 'user-1' } as User;
    userRepository.findOne.mockResolvedValue(user);

    await expect(
      repository.findByEmailOrPhone('a@b.com', '0991112233'),
    ).resolves.toBe(user);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
      relations: { role: true },
    });
  });

  it('should find a user by phone when no email is given', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      repository.findByEmailOrPhone(undefined, '0991112233'),
    ).resolves.toBeNull();
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { mobileNumber: '0991112233' },
      relations: { role: true },
    });
  });

  it('should find a role by name', async () => {
    const role = { id: 'role-1', name: 'user' } as Role;
    roleRepository.findOne.mockResolvedValue(role);

    await expect(repository.findRoleByName('user')).resolves.toBe(role);
    expect(roleRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'user' },
    });
  });

  it('should create and save a user', async () => {
    const result = await repository.createUser({ email: 'a@b.com' });

    expect(userRepository.create).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(userRepository.save).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(result).toEqual({ id: 'user-1', email: 'a@b.com' });
  });

  it('should check whether a shop exists', async () => {
    shopRepository.existsBy.mockResolvedValue(true);

    await expect(repository.shopExists('shop-1')).resolves.toBe(true);
    expect(shopRepository.existsBy).toHaveBeenCalledWith({ id: 'shop-1' });
  });

  it('should bind a user to a shop, ignoring an existing binding', async () => {
    await repository.bindUserToShop('user-1', 'shop-1');

    expect(insertQueryBuilder.into).toHaveBeenCalledWith('users_shops', [
      'user_id',
      'shop_id',
    ]);
    expect(insertQueryBuilder.values).toHaveBeenCalledWith({
      user_id: 'user-1',
      shop_id: 'shop-1',
    });
    expect(insertQueryBuilder.orIgnore).toHaveBeenCalled();
    expect(insertQueryBuilder.execute).toHaveBeenCalled();
  });
});
