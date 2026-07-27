import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VariationTypeName } from '../../entities/enums/variation-type.enum';
import { VariationType } from '../../entities/variation-type.entity';
import { VariationTypeRepository } from './variation-type.repository';

describe('VariationTypeRepository', () => {
  let repository: VariationTypeRepository;
  let typeOrmRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    typeOrmRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariationTypeRepository,
        {
          provide: getRepositoryToken(VariationType),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<VariationTypeRepository>(VariationTypeRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find paginated variation types without filters', async () => {
    const items = [{ id: '1' }] as VariationType[];
    queryBuilder.getManyAndCount.mockResolvedValue([items, 1]);

    const result = await repository.findAllPaginated({}, 0, 20);

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'variationType',
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'variationType.createdAt',
      'DESC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ items, total: 1 });
  });

  it('should filter by name', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.findAllPaginated({ name: VariationTypeName.COLOR }, 0, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'variationType.name = :name',
      { name: VariationTypeName.COLOR },
    );
  });

  it('should filter by value', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await repository.findAllPaginated({ value: 'red' }, 0, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'variationType.value ILIKE :value',
      { value: '%red%' },
    );
  });

  it('should find variation type by id', async () => {
    const item = { id: '1' } as VariationType;
    typeOrmRepository.findOne.mockResolvedValue(item);

    const result = await repository.findById('1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(item);
  });

  it('should throw when variation type is not found by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find variation type by name and value', async () => {
    const item = { id: '1', name: VariationTypeName.COLOR, value: 'Red' };
    typeOrmRepository.findOne.mockResolvedValue(item);

    const result = await repository.findByNameAndValue(
      VariationTypeName.COLOR,
      'Red',
    );

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { name: VariationTypeName.COLOR, value: 'Red' },
    });
    expect(result).toEqual(item);
  });

  it('should create variation type entity', () => {
    const payload = {
      name: VariationTypeName.COLOR,
      value: 'Red',
    };
    const item = { id: '1', ...payload };
    typeOrmRepository.create.mockReturnValue(item);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(item);
  });

  it('should save variation type entity', async () => {
    const item = { id: '1' } as VariationType;
    typeOrmRepository.save.mockResolvedValue(item);

    const result = await repository.save(item);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(item);
    expect(result).toEqual(item);
  });

  it('should remove variation type entity', async () => {
    const item = { id: '1' } as VariationType;
    typeOrmRepository.remove.mockResolvedValue(item);

    const result = await repository.remove(item);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(item);
    expect(result).toEqual(item);
  });
});
