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
