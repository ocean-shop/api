import { Test, TestingModule } from '@nestjs/testing';
import { ShippingController } from './shipping-controller';
import { ShippingService } from '../../../services/shipping/shipping.service';
import { CreateShippingDto } from '../../../dto/create-shipping.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { AuthenticatedRequest } from '../../../models/auth-request.models';
import { OrderShippingMethod } from '../../../../orders/entities/enums/order.enum';

describe('ShippingController', () => {
  let controller: ShippingController;
  let shippingService: ShippingService;

  const userId = '98f21967-fce6-4ceb-af61-304913f593a7';
  const request = {
    user: { sub: userId, email: null, role: 'user', mobileNumber: null },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const shippingServiceMock = {
      getShippings: jest.fn(),
      createShipping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [{ provide: ShippingService, useValue: shippingServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ShippingController>(ShippingController);
    shippingService = module.get<ShippingService>(ShippingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getShippings', () => {
    it('should call shippingService.getShippings', async () => {
      const expectedResult = [
        {
          id: 'a1b2c3d4-0000-4000-8000-000000000001',
          userId,
          method: OrderShippingMethod.NOVA,
          address: 'Kyiv, branch 12',
        },
      ];

      jest
        .mocked(shippingService.getShippings)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.getShippings(userId, request);

      expect(shippingService.getShippings).toHaveBeenCalledWith(
        userId,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createShipping', () => {
    it('should call shippingService.createShipping', async () => {
      const dto: CreateShippingDto = {
        method: OrderShippingMethod.UKR,
        address: 'Lviv, 79000',
      };
      const expectedResult = {
        id: 'a1b2c3d4-0000-4000-8000-000000000002',
        userId,
        ...dto,
      };

      jest
        .mocked(shippingService.createShipping)
        .mockResolvedValue(expectedResult as any);

      const result = await controller.createShipping(userId, dto, request);

      expect(shippingService.createShipping).toHaveBeenCalledWith(
        userId,
        dto,
        request.user,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
