import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { ListUsersByShopQueryDto } from '../../dto/list-users-by-shop-query.dto';
import { UsersService } from '../../services/users/users.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const usersServiceMock = {
      getUsersByShop: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return users by shop', async () => {
    const query: ListUsersByShopQueryDto = {
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
    };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(usersService.getUsersByShop).mockResolvedValue(expected);

    const result = await controller.getUsersByShop(query);

    expect(usersService.getUsersByShop).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });
});
