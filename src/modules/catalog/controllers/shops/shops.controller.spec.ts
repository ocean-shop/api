import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CreateShopDto } from '../../dto/create-shop.dto';
import { UpdateShopDto } from '../../dto/update-shop.dto';
import { ShopsService } from '../../services/shops/shops.service';
import { ShopsController } from './shops.controller';

describe('ShopsController', () => {
  let controller: ShopsController;
  let shopsService: ShopsService;

  beforeEach(async () => {
    const shopsServiceMock = {
      listShops: jest.fn(),
      getShopById: jest.fn(),
      createShop: jest.fn(),
      updateShop: jest.fn(),
      removeShop: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopsController],
      providers: [{ provide: ShopsService, useValue: shopsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ShopsController>(ShopsController);
    shopsService = module.get<ShopsService>(ShopsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list shops', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(shopsService.listShops).mockResolvedValue(expected);

    const result = await controller.listShops(query);

    expect(shopsService.listShops).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should get shop by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { id, name: 'Ocean Store' };
    jest.mocked(shopsService.getShopById).mockResolvedValue(expected as any);

    const result = await controller.getShopById(id);

    expect(shopsService.getShopById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should create shop', async () => {
    const dto: CreateShopDto = {
      name: 'Ocean Store',
      description: 'Storefront for ocean products',
      url: 'https://ocean.example.com',
    };
    const expected = { id: '1', ...dto };
    jest.mocked(shopsService.createShop).mockResolvedValue(expected as any);

    const result = await controller.createShop(dto);

    expect(shopsService.createShop).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should update shop', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: UpdateShopDto = { description: 'Updated description' };
    const expected = { id, name: 'Ocean Store', ...dto };
    jest.mocked(shopsService.updateShop).mockResolvedValue(expected as any);

    const result = await controller.updateShop(id, dto);

    expect(shopsService.updateShop).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('should remove shop', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { message: 'Shop removed successfully' };
    jest.mocked(shopsService.removeShop).mockResolvedValue(expected);

    const result = await controller.removeShop(id);

    expect(shopsService.removeShop).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
