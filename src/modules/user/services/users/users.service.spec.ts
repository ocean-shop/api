import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../../repositories/users/users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: UsersRepository;

  beforeEach(async () => {
    const usersRepositoryMock = {
      findUsersByShopId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepositoryMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should paginate users by shop', async () => {
    const query = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 2,
      limit: 10,
      email: 'john',
      phoneNumber: '555',
      sortOrder: 'asc' as const,
    };
    jest.mocked(usersRepository.findUsersByShopId).mockResolvedValue({
      items: [{ id: 'user-1', orders: [] }] as any,
      total: 21,
    });

    const result = await service.getUsersByShop(query);

    expect(usersRepository.findUsersByShopId).toHaveBeenCalledWith(
      query.shopId,
      10,
      10,
      query.email,
      query.phoneNumber,
      query.sortOrder,
    );
    expect(result).toEqual({
      items: [{ id: 'user-1', orders: [] }],
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('should return zero total pages when there are no users', async () => {
    const query = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
    };
    jest.mocked(usersRepository.findUsersByShopId).mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await service.getUsersByShop(query);

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('should pass undefined optional filters and default sort order', async () => {
    const query = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
    };
    jest.mocked(usersRepository.findUsersByShopId).mockResolvedValue({
      items: [],
      total: 0,
    });

    await service.getUsersByShop(query);

    expect(usersRepository.findUsersByShopId).toHaveBeenCalledWith(
      query.shopId,
      0,
      20,
      undefined,
      undefined,
      undefined,
    );
  });
});
