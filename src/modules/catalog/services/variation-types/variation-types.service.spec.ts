import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { VariationTypeName } from '../../entities/enums/variation-type.enum';
import { VariationTypeRepository } from '../../repositories/variation-type/variation-type.repository';
import { VariationTypesService } from './variation-types.service';

describe('VariationTypesService', () => {
  let service: VariationTypesService;
  let variationTypeRepository: VariationTypeRepository;

  beforeEach(async () => {
    const variationTypeRepositoryMock = {
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      save: jest.fn((variationType) => Promise.resolve(variationType)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariationTypesService,
        {
          provide: VariationTypeRepository,
          useValue: variationTypeRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<VariationTypesService>(VariationTypesService);
    variationTypeRepository = module.get<VariationTypeRepository>(
      VariationTypeRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list variation types with pagination', async () => {
    jest.mocked(variationTypeRepository.findAllPaginated).mockResolvedValue({
      items: [{ id: '1' }] as any,
      total: 1,
    });

    const result = await service.listVariationTypes({ page: 1, limit: 20 });

    expect(variationTypeRepository.findAllPaginated).toHaveBeenCalledWith(
      {},
      0,
      20,
    );
    expect(result.totalPages).toBe(1);
  });

  it('should list variation types with filters', async () => {
    jest.mocked(variationTypeRepository.findAllPaginated).mockResolvedValue({
      items: [],
      total: 0,
    });

    await service.listVariationTypes({
      page: 1,
      limit: 20,
      name: VariationTypeName.COLOR,
    });

    expect(variationTypeRepository.findAllPaginated).toHaveBeenCalledWith(
      {
        name: VariationTypeName.COLOR,
      },
      0,
      20,
    );
  });

  it('should create variation type', async () => {
    const payload = {
      id: '1',
      name: VariationTypeName.COLOR,
    } as any;

    jest.mocked(variationTypeRepository.findByName).mockResolvedValue(null);
    jest.mocked(variationTypeRepository.create).mockReturnValue(payload);
    jest.mocked(variationTypeRepository.save).mockResolvedValue(payload);

    const result = await service.createVariationType({
      name: VariationTypeName.COLOR,
    });

    expect(variationTypeRepository.create).toHaveBeenCalledWith({
      name: VariationTypeName.COLOR,
    });
    expect(result).toEqual(payload);
  });

  it('should throw when variation type exists on create', async () => {
    jest.mocked(variationTypeRepository.findByName).mockResolvedValue({
      id: 'existing-id',
      name: VariationTypeName.COLOR,
    } as any);

    await expect(
      service.createVariationType({
        name: VariationTypeName.COLOR,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw bad request for duplicate variation type on create save', async () => {
    const payload = {
      id: '1',
      name: VariationTypeName.COLOR,
    } as any;

    jest.mocked(variationTypeRepository.findByName).mockResolvedValue(null);
    jest.mocked(variationTypeRepository.create).mockReturnValue(payload);
    jest.mocked(variationTypeRepository.save).mockRejectedValue(
      new QueryFailedError('INSERT INTO variation_types', [], {
        code: '23505',
        constraint: 'uq_variation_types_name',
      }),
    );

    await expect(
      service.createVariationType({
        name: VariationTypeName.COLOR,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update variation type', async () => {
    const existing = {
      id: '1',
      name: VariationTypeName.COLOR,
    } as any;
    const saved = {
      ...existing,
      name: VariationTypeName.CUSTOM,
    };

    jest.mocked(variationTypeRepository.findById).mockResolvedValue(existing);
    jest.mocked(variationTypeRepository.findByName).mockResolvedValue(null);
    jest.mocked(variationTypeRepository.save).mockResolvedValue(saved);

    const result = await service.updateVariationType('1', {
      name: VariationTypeName.CUSTOM,
    });

    expect(variationTypeRepository.save).toHaveBeenCalledWith({
      ...existing,
      name: VariationTypeName.CUSTOM,
    });
    expect(result).toEqual(saved);
  });

  it('should throw when variation type exists on update', async () => {
    jest.mocked(variationTypeRepository.findById).mockResolvedValue({
      id: '1',
      name: VariationTypeName.COLOR,
    } as any);
    jest.mocked(variationTypeRepository.findByName).mockResolvedValue({
      id: 'existing-id',
      name: VariationTypeName.CUSTOM,
    } as any);

    await expect(
      service.updateVariationType('1', {
        name: VariationTypeName.CUSTOM,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should remove variation type', async () => {
    const variationType = {
      id: '1',
      name: VariationTypeName.COLOR,
    } as any;
    jest
      .mocked(variationTypeRepository.findById)
      .mockResolvedValue(variationType);
    jest
      .mocked(variationTypeRepository.remove)
      .mockResolvedValue(variationType);

    const result = await service.removeVariationType('1');

    expect(variationTypeRepository.findById).toHaveBeenCalledWith('1');
    expect(variationTypeRepository.remove).toHaveBeenCalledWith(variationType);
    expect(result).toEqual({ message: 'Variation type removed successfully' });
  });
});
