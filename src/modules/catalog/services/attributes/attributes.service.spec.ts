import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { AttributeRepository } from '../../repositories/attribute/attribute.repository';
import { AttributesService } from './attributes.service';

describe('AttributesService', () => {
  let service: AttributesService;
  let attributeRepository: AttributeRepository;

  beforeEach(async () => {
    const attributeRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn((attribute) => Promise.resolve(attribute)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributesService,
        { provide: AttributeRepository, useValue: attributeRepositoryMock },
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
    attributeRepository = module.get<AttributeRepository>(AttributeRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all attributes with pagination', async () => {
    const items = [
      { id: '1', shopId: 'shop-id', name: 'Color', value: 'Red' },
      { id: '2', shopId: 'shop-id', name: 'Size', value: 'M' },
    ] as any;
    jest.mocked(attributeRepository.findAllPaginated).mockResolvedValue({
      items,
      total: 2,
    });

    const result = await service.getAllAttributes({});

    expect(attributeRepository.findAllPaginated).toHaveBeenCalledWith(
      undefined,
      undefined,
      0,
      20,
    );
    expect(result).toEqual({
      items,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('should return attributes filtered by name with pagination', async () => {
    const items = [{ id: '1', shopId: 'shop-id', name: 'Color' }] as any;
    jest.mocked(attributeRepository.findAllPaginated).mockResolvedValue({
      items,
      total: 1,
    });

    const result = await service.getAllAttributes({
      name: 'col',
      page: 2,
      limit: 10,
    });

    expect(attributeRepository.findAllPaginated).toHaveBeenCalledWith(
      'col',
      undefined,
      10,
      10,
    );
    expect(result).toEqual({
      items,
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    });
  });

  it('should return attributes filtered by shopId', async () => {
    const items = [{ id: '1', shopId: 'shop-id', name: 'Color' }] as any;
    jest.mocked(attributeRepository.findAllPaginated).mockResolvedValue({
      items,
      total: 1,
    });

    const result = await service.getAllAttributes({
      shopId: '98f21967-fce6-4ceb-af61-304913f593a7',
      page: 1,
      limit: 20,
    });

    expect(attributeRepository.findAllPaginated).toHaveBeenCalledWith(
      undefined,
      '98f21967-fce6-4ceb-af61-304913f593a7',
      0,
      20,
    );
    expect(result).toEqual({
      items,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('should create an attribute', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      name: 'Color',
      value: 'Red',
    } as any;
    jest.mocked(attributeRepository.create).mockReturnValue(payload);
    jest.mocked(attributeRepository.save).mockResolvedValue(payload);

    const result = await service.createAttribute({
      shopId: 'shop-id',
      name: 'Color',
      value: 'Red',
    });

    expect(attributeRepository.create).toHaveBeenCalledWith({
      shopId: 'shop-id',
      name: 'Color',
      value: 'Red',
    });
    expect(result).toEqual(payload);
  });

  it('should throw bad request when attribute name and value already exist in shop', async () => {
    const payload = {
      id: '1',
      shopId: 'shop-id',
      name: 'Color',
      value: 'Red',
    } as any;
    jest.mocked(attributeRepository.create).mockReturnValue(payload);
    jest.mocked(attributeRepository.save).mockRejectedValue(
      new QueryFailedError('INSERT INTO attribute_types', [], {
        code: '23505',
        constraint: 'attribute_types_shop_id_name_value_key',
      }),
    );

    await expect(
      service.createAttribute({
        shopId: 'shop-id',
        name: 'Color',
        value: 'Red',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Attribute with this name and value already exists for this shop',
      ),
    );
  });

  it('should remove an attribute', async () => {
    const attribute = { id: '1', name: 'Color' } as any;
    jest.mocked(attributeRepository.findById).mockResolvedValue(attribute);
    jest.mocked(attributeRepository.remove).mockResolvedValue(attribute);

    const result = await service.removeAttribute('1');

    expect(attributeRepository.findById).toHaveBeenCalledWith('1');
    expect(attributeRepository.remove).toHaveBeenCalledWith(attribute);
    expect(result).toEqual({ message: 'Attribute removed successfully' });
  });
});
