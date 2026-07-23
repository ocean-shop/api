import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attribute } from '../../entities/attribute.entity';
import { AttributeRepository } from './attribute.repository';

describe('AttributeRepository', () => {
  let repository: AttributeRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    typeOrmRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributeRepository,
        {
          provide: getRepositoryToken(Attribute),
          useValue: typeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<AttributeRepository>(AttributeRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find attribute by id', async () => {
    const attribute = { id: '1' } as Attribute;
    typeOrmRepository.findOne.mockResolvedValue(attribute);

    const result = await repository.findById('1');

    expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(attribute);
  });

  it('should throw when attribute is not found by id', async () => {
    typeOrmRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create attribute entity', () => {
    const payload = { shopId: 'shop-id', name: 'Color', value: 'Red' };
    const attribute = { id: '1', ...payload };
    typeOrmRepository.create.mockReturnValue(attribute);

    const result = repository.create(payload);

    expect(typeOrmRepository.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(attribute);
  });

  it('should find all attributes without name filter', async () => {
    const attributes = [{ id: '1' }] as Attribute[];
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([attributes, 1]),
    };
    typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await repository.findAllPaginated(
      undefined,
      undefined,
      0,
      20,
    );

    expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith(
      'attribute',
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'attribute.createdAt',
      'DESC',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(result).toEqual({ items: attributes, total: 1 });
  });

  it('should find all attributes with name filter', async () => {
    const attributes = [{ id: '1', name: 'Color' }] as Attribute[];
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([attributes, 1]),
    };
    typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await repository.findAllPaginated('col', undefined, 20, 10);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'attribute.name ILIKE :name',
      { name: '%col%' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({ items: attributes, total: 1 });
  });

  it('should find all attributes with shop filter', async () => {
    const attributes = [{ id: '1', shopId: 'shop-id' }] as Attribute[];
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([attributes, 1]),
    };
    typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await repository.findAllPaginated(
      undefined,
      'shop-id',
      0,
      20,
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'attribute.shopId = :shopId',
      { shopId: 'shop-id' },
    );
    expect(result).toEqual({ items: attributes, total: 1 });
  });

  it('should save attribute entity', async () => {
    const attribute = { id: '1' } as Attribute;
    typeOrmRepository.save.mockResolvedValue(attribute);

    const result = await repository.save(attribute);

    expect(typeOrmRepository.save).toHaveBeenCalledWith(attribute);
    expect(result).toEqual(attribute);
  });

  it('should remove attribute entity', async () => {
    const attribute = { id: '1' } as Attribute;
    typeOrmRepository.remove.mockResolvedValue(attribute);

    const result = await repository.remove(attribute);

    expect(typeOrmRepository.remove).toHaveBeenCalledWith(attribute);
    expect(result).toEqual(attribute);
  });
});
