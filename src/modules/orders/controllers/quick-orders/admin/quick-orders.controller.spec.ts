import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { QuickOrderStatus } from '../../../entities/enums/quick-order.enum';
import { QuickOrder } from '../../../entities/quick-order.entity';
import { QuickOrdersService } from '../../../services/quick-orders/admin/quick-orders.service';
import { QuickOrdersController } from './quick-orders.controller';

describe('QuickOrdersController', () => {
  let controller: QuickOrdersController;
  let quickOrdersService: QuickOrdersService;

  const id = '98f21967-fce6-4ceb-af61-304913f593a7';

  beforeEach(async () => {
    const quickOrdersServiceMock = {
      listQuickOrders: jest.fn(),
      getQuickOrderById: jest.fn(),
      updateQuickOrder: jest.fn(),
      removeQuickOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuickOrdersController],
      providers: [
        { provide: QuickOrdersService, useValue: quickOrdersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<QuickOrdersController>(QuickOrdersController);
    quickOrdersService = module.get<QuickOrdersService>(QuickOrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list quick orders', async () => {
    const query = { shopId: id, page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(quickOrdersService.listQuickOrders).mockResolvedValue(expected);

    const result = await controller.listQuickOrders(query);

    expect(quickOrdersService.listQuickOrders).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should get quick order by id', async () => {
    const quickOrder = { id } as QuickOrder;
    jest
      .mocked(quickOrdersService.getQuickOrderById)
      .mockResolvedValue(quickOrder);

    const result = await controller.getQuickOrderById(id);

    expect(quickOrdersService.getQuickOrderById).toHaveBeenCalledWith(id);
    expect(result).toBe(quickOrder);
  });

  it('should update quick order', async () => {
    const dto = { status: QuickOrderStatus.PROCESSED };
    const quickOrder = { id, ...dto } as QuickOrder;
    jest
      .mocked(quickOrdersService.updateQuickOrder)
      .mockResolvedValue(quickOrder);

    const result = await controller.updateQuickOrder(id, dto);

    expect(quickOrdersService.updateQuickOrder).toHaveBeenCalledWith(id, dto);
    expect(result).toBe(quickOrder);
  });

  it('should remove quick order', async () => {
    const expected = { message: 'removed' };
    jest
      .mocked(quickOrdersService.removeQuickOrder)
      .mockResolvedValue(expected);

    const result = await controller.removeQuickOrder(id);

    expect(quickOrdersService.removeQuickOrder).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
