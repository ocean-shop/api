import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopRepository } from '../../repositories/shop/shop.repository';

describe('ShopsService', () => {
  let service: ShopsService;
  let shopRepository: ShopRepository;

  beforeEach(async () => {
    const shopRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn((shop) => Promise.resolve(shop)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopsService,
        { provide: ShopRepository, useValue: shopRepositoryMock },
      ],
    }).compile();

    service = module.get<ShopsService>(ShopsService);
    shopRepository = module.get<ShopRepository>(ShopRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list shops with pagination', async () => {
    jest.mocked(shopRepository.findAllPaginated).mockResolvedValue({
      items: [{ id: '1' }] as any,
      total: 1,
    });

    const result = await service.listShops({ page: 1, limit: 20 });

    expect(shopRepository.findAllPaginated).toHaveBeenCalledWith(0, 20);
    expect(result.totalPages).toBe(1);
  });

  it('should return one shop', async () => {
    const shop = { id: '1', name: 'Ocean Store' } as any;
    jest.mocked(shopRepository.findById).mockResolvedValue(shop);

    const result = await service.getShopById('1');

    expect(shopRepository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(shop);
  });

  it('should create a shop', async () => {
    const payload = {
      id: '1',
      name: 'Ocean Store',
      description: 'Storefront for ocean products',
      url: 'https://ocean.example.com',
    } as any;
    jest.mocked(shopRepository.create).mockReturnValue(payload);
    jest.mocked(shopRepository.save).mockResolvedValue(payload);

    const result = await service.createShop({
      name: 'Ocean Store',
      description: 'Storefront for ocean products',
      url: 'https://ocean.example.com',
    });

    expect(shopRepository.create).toHaveBeenCalledWith({
      name: 'Ocean Store',
      description: 'Storefront for ocean products',
      url: 'https://ocean.example.com',
    });
    expect(result).toEqual(payload);
  });

  it('should update a shop', async () => {
    const existing = {
      id: '1',
      name: 'Ocean Store',
      description: 'Old',
      url: 'https://ocean.example.com',
    } as any;
    const saved = { ...existing, description: 'Updated' };
    jest.mocked(shopRepository.findById).mockResolvedValue(existing);

    const result = await service.updateShop('1', { description: 'Updated' });

    expect(shopRepository.findById).toHaveBeenCalledWith('1');
    expect(shopRepository.save).toHaveBeenCalledWith({
      ...existing,
      description: 'Updated',
    });
    expect(result).toEqual(saved);
  });

  it('should throw when updating unknown shop', async () => {
    jest
      .mocked(shopRepository.findById)
      .mockRejectedValue(new NotFoundException('Shop not found'));

    await expect(
      service.updateShop('missing', { name: 'New' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should remove a shop', async () => {
    const shop = { id: '1', name: 'Ocean Store' } as any;
    jest.mocked(shopRepository.findById).mockResolvedValue(shop);
    jest.mocked(shopRepository.remove).mockResolvedValue(shop);

    const result = await service.removeShop('1');

    expect(shopRepository.findById).toHaveBeenCalledWith('1');
    expect(shopRepository.remove).toHaveBeenCalledWith(shop);
    expect(result).toEqual({ message: 'Shop removed successfully' });
  });
});
