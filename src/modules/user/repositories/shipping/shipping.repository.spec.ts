import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { USER_MESSAGES } from '../../constants/user-messages.constants';
import { UserShipping } from '../../entities/user-shipping.entity';
import { ShippingRepository } from './shipping.repository';

const LOCK_QUERY = 'SELECT pg_advisory_xact_lock(hashtext($1))';

describe('ShippingRepository', () => {
  let repository: ShippingRepository;
  let typeOrmRepository: any;
  let manager: any;

  beforeEach(async () => {
    manager = {
      query: jest.fn(),
      exists: jest.fn(),
      update: jest.fn(),
      create: jest.fn((_entity, payload) => payload),
      save: jest.fn((_entity, payload) => Promise.resolve(payload)),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    typeOrmRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      manager: {
        transaction: jest.fn((work: (m: unknown) => unknown) => work(manager)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingRepository,
        {
          provide: getRepositoryToken(UserShipping),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ShippingRepository>(ShippingRepository);
  });

  it('should list the shippings of a user, main first', async () => {
    const shippings = [{ id: 's-1' }] as UserShipping[];
    typeOrmRepository.find.mockResolvedValue(shippings);

    await expect(repository.findByUserId('user-1')).resolves.toBe(shippings);
    expect(typeOrmRepository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { isMain: 'DESC', createdAt: 'DESC' },
    });
  });

  it('should find the main shipping of a user', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findMainByUserId('user-1')).resolves.toBeNull();
    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-1', isMain: true },
    });
  });

  describe('create', () => {
    it('should make the first shipping of a user the main one', async () => {
      manager.exists.mockResolvedValue(false);

      const result = await repository.create({
        userId: 'user-1',
        address: 'Kyiv',
      });

      expect(manager.query).toHaveBeenCalledWith(LOCK_QUERY, ['user-1']);
      expect(manager.update).toHaveBeenCalledWith(
        UserShipping,
        { userId: 'user-1', isMain: true },
        { isMain: false },
      );
      expect(result).toEqual({
        userId: 'user-1',
        address: 'Kyiv',
        isMain: true,
      });
    });

    it('should keep the current main shipping for a secondary one', async () => {
      manager.exists.mockResolvedValue(true);

      const result = await repository.create({
        userId: 'user-1',
        isMain: false,
      });

      expect(manager.update).not.toHaveBeenCalled();
      expect(result.isMain).toBe(false);
    });

    it('should replace the main shipping when a new main one is added', async () => {
      manager.exists.mockResolvedValue(true);

      const result = await repository.create({
        userId: 'user-1',
        isMain: true,
      });

      expect(manager.update).toHaveBeenCalledWith(
        UserShipping,
        { userId: 'user-1', isMain: true },
        { isMain: false },
      );
      expect(result.isMain).toBe(true);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException for a shipping of another user', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(repository.remove('user-1', 's-1')).rejects.toThrow(
        new NotFoundException(USER_MESSAGES.SHIPPING_NOT_FOUND),
      );
      expect(manager.delete).not.toHaveBeenCalled();
    });

    it('should delete a secondary shipping without promoting another', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 's-1', isMain: false });

      await repository.remove('user-1', 's-1');

      expect(manager.delete).toHaveBeenCalledWith(UserShipping, { id: 's-1' });
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('should promote the newest remaining shipping after removing the main one', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 's-1', isMain: true })
        .mockResolvedValueOnce({ id: 's-2', isMain: false });

      await repository.remove('user-1', 's-1');

      expect(manager.findOne).toHaveBeenLastCalledWith(UserShipping, {
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(manager.update).toHaveBeenCalledWith(
        UserShipping,
        { id: 's-2' },
        { isMain: true },
      );
    });

    it('should not promote anything when the main shipping was the last one', async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 's-1', isMain: true })
        .mockResolvedValueOnce(null);

      await repository.remove('user-1', 's-1');

      expect(manager.update).not.toHaveBeenCalled();
    });
  });

  describe('setMain', () => {
    it('should throw NotFoundException for a shipping of another user', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(repository.setMain('user-1', 's-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a shipping that is already main untouched', async () => {
      const shipping = { id: 's-1', isMain: true };
      manager.findOne.mockResolvedValue(shipping);

      await expect(repository.setMain('user-1', 's-1')).resolves.toBe(shipping);
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('should unset the previous main shipping and mark this one', async () => {
      manager.findOne.mockResolvedValue({ id: 's-2', isMain: false });

      const result = await repository.setMain('user-1', 's-2');

      expect(manager.update).toHaveBeenCalledWith(
        UserShipping,
        { userId: 'user-1', isMain: true },
        { isMain: false },
      );
      expect(manager.save).toHaveBeenCalledWith(UserShipping, {
        id: 's-2',
        isMain: true,
      });
      expect(result).toEqual({ id: 's-2', isMain: true });
    });
  });
});
