import { Test, TestingModule } from '@nestjs/testing';
import { AdminsController } from './admins.controller';
import { AdminsService } from '../../services/admins/admins.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CreateAdminDto } from '../../dto/create-admin.dto';
import { UpdateAdminDto } from '../../dto/update-admin.dto';

describe('AdminsController', () => {
  let controller: AdminsController;
  let adminsService: AdminsService;

  beforeEach(async () => {
    const adminsServiceMock = {
      listAdmins: jest.fn(),
      getAdminById: jest.fn(),
      createAdmin: jest.fn(),
      updateAdmin: jest.fn(),
      removeAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminsController],
      providers: [{ provide: AdminsService, useValue: adminsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AdminsController>(AdminsController);
    adminsService = module.get<AdminsService>(AdminsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list admins', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    jest.mocked(adminsService.listAdmins).mockResolvedValue(expected);

    const result = await controller.listAdmins(query);

    expect(adminsService.listAdmins).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('should get admin by id', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const expected = { id };
    jest.mocked(adminsService.getAdminById).mockResolvedValue(expected as any);

    const result = await controller.getAdminById(id);

    expect(adminsService.getAdminById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('should create admin', async () => {
    const dto: CreateAdminDto = {
      email: 'admin@example.com',
      role: 'admin',
      shopIds: ['98f21967-fce6-4ceb-af61-304913f593a7'],
    };
    const expected = { id: '1', ...dto };
    jest.mocked(adminsService.createAdmin).mockResolvedValue(expected as any);

    const result = await controller.createAdmin(dto);

    expect(adminsService.createAdmin).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should update admin', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const dto: UpdateAdminDto = {
      isActive: false,
      shopIds: ['98f21967-fce6-4ceb-af61-304913f593a7'],
    };
    const req = {
      user: { sub: '8f222f64-fa6e-4f7f-b2f2-68d2180058a8' },
    } as any;
    const expected = { id, ...dto };
    jest.mocked(adminsService.updateAdmin).mockResolvedValue(expected as any);

    const result = await controller.updateAdmin(id, dto, req);

    expect(adminsService.updateAdmin).toHaveBeenCalledWith(
      id,
      dto,
      req.user.sub,
    );
    expect(result).toEqual(expected);
  });

  it('should remove admin', async () => {
    const id = '98f21967-fce6-4ceb-af61-304913f593a7';
    const req = {
      user: { sub: '8f222f64-fa6e-4f7f-b2f2-68d2180058a8' },
    } as any;
    const expected = { message: 'Admin user removed successfully' };
    jest.mocked(adminsService.removeAdmin).mockResolvedValue(expected);

    const result = await controller.removeAdmin(id, req);

    expect(adminsService.removeAdmin).toHaveBeenCalledWith(id, req.user.sub);
    expect(result).toEqual(expected);
  });
});
