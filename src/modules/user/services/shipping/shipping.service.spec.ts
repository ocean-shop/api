import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserShipping } from '../../entities/user-shipping.entity';
import { JwtPayload } from '../../models/auth-request.models';
import { ShippingRepository } from '../../repositories/shipping/shipping.repository';
import { UserRepository } from '../../repositories/user/user.repository';
import { ShippingService } from './shipping.service';

const USER_ID = 'user-1';
const SHIPPING_ID = 'shipping-1';
const otherClient: JwtPayload = {
  sub: 'user-2',
  role: 'user',
  email: null,
  mobileNumber: null,
};

describe('ShippingService', () => {
  let service: ShippingService;
  let userRepository: { findById: jest.Mock };
  let shippingRepository: {
    findByUserId: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
    setMain: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = { findById: jest.fn().mockResolvedValue({ id: USER_ID }) };
    shippingRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      setMain: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: UserRepository, useValue: userRepository },
        { provide: ShippingRepository, useValue: shippingRepository },
      ],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
  });

  it('should list the shippings of a user', async () => {
    const shippings = [{ id: SHIPPING_ID }] as UserShipping[];
    shippingRepository.findByUserId.mockResolvedValue(shippings);

    await expect(service.getShippings(USER_ID)).resolves.toBe(shippings);
    expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
    expect(shippingRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('should create a shipping that is not main by default', async () => {
    const created = { id: SHIPPING_ID } as UserShipping;
    shippingRepository.create.mockResolvedValue(created);

    const result = await service.createShipping(USER_ID, {
      method: 'nova',
      address: 'Kyiv, branch 1',
    } as any);

    expect(shippingRepository.create).toHaveBeenCalledWith({
      userId: USER_ID,
      method: 'nova',
      address: 'Kyiv, branch 1',
      isMain: false,
    });
    expect(result).toBe(created);
  });

  it('should pass the main flag through when creating a shipping', async () => {
    await service.createShipping(USER_ID, {
      method: 'nova',
      address: 'Kyiv',
      isMain: true,
    } as any);

    expect(shippingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ isMain: true }),
    );
  });

  it('should remove a shipping', async () => {
    await service.removeShipping(USER_ID, SHIPPING_ID);

    expect(shippingRepository.remove).toHaveBeenCalledWith(
      USER_ID,
      SHIPPING_ID,
    );
  });

  it('should set the main shipping', async () => {
    const shipping = { id: SHIPPING_ID, isMain: true } as UserShipping;
    shippingRepository.setMain.mockResolvedValue(shipping);

    await expect(service.setMainShipping(USER_ID, SHIPPING_ID)).resolves.toBe(
      shipping,
    );
    expect(shippingRepository.setMain).toHaveBeenCalledWith(
      USER_ID,
      SHIPPING_ID,
    );
  });

  it.each([
    ['list', (s: ShippingService) => s.getShippings(USER_ID, otherClient)],
    [
      'create',
      (s: ShippingService) =>
        s.createShipping(USER_ID, { address: 'x' } as any, otherClient),
    ],
    [
      'remove',
      (s: ShippingService) =>
        s.removeShipping(USER_ID, SHIPPING_ID, otherClient),
    ],
    [
      'set main',
      (s: ShippingService) =>
        s.setMainShipping(USER_ID, SHIPPING_ID, otherClient),
    ],
  ])(
    'should forbid a client to %s the shippings of another user',
    async (_label, call) => {
      await expect(call(service)).rejects.toThrow(ForbiddenException);
      expect(userRepository.findById).not.toHaveBeenCalled();
    },
  );
});
