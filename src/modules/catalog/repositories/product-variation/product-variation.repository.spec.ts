import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PRODUCT_VARIATION_MESSAGES } from '../../constants/product-messages.constants';
import { ProductVariation } from '../../entities/product-variation.entity';
import { VariationAttribute } from '../../entities/variation-attribute.entity';
import { VariationImage } from '../../entities/variation-image.entity';
import { ProductVariationRepository } from './product-variation.repository';

describe('ProductVariationRepository', () => {
  let repository: ProductVariationRepository;
  let variationRepository: any;
  let attributeRepository: any;
  let imageRepository: any;

  beforeEach(async () => {
    variationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    attributeRepository = {
      delete: jest.fn(),
      create: jest.fn((payload) => payload),
      save: jest.fn((entities) => Promise.resolve(entities)),
    };
    imageRepository = {
      delete: jest.fn(),
      create: jest.fn((payload) => payload),
      save: jest.fn((entities) => Promise.resolve(entities)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariationRepository,
        {
          provide: getRepositoryToken(ProductVariation),
          useValue: variationRepository,
        },
        {
          provide: getRepositoryToken(VariationAttribute),
          useValue: attributeRepository,
        },
        {
          provide: getRepositoryToken(VariationImage),
          useValue: imageRepository,
        },
      ],
    }).compile();

    repository = module.get<ProductVariationRepository>(
      ProductVariationRepository,
    );
  });

  it('should delegate create and save to TypeORM', async () => {
    const variation = { id: 'variation-1' } as ProductVariation;
    variationRepository.create.mockReturnValue(variation);
    variationRepository.save.mockResolvedValue(variation);

    expect(repository.create({ sku: 'SKU-1' })).toBe(variation);
    await expect(repository.save(variation)).resolves.toBe(variation);

    expect(variationRepository.create).toHaveBeenCalledWith({ sku: 'SKU-1' });
    expect(variationRepository.save).toHaveBeenCalledWith(variation);
  });

  it('should find a variation with its attributes and sorted images', async () => {
    const variation = { id: 'variation-1' } as ProductVariation;
    variationRepository.findOne.mockResolvedValue(variation);

    const result = await repository.findById('variation-1');

    expect(variationRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'variation-1' },
      relations: { attributes: { attributeType: true }, images: true },
      order: { images: { sort: 'ASC' } },
    });
    expect(result).toBe(variation);
  });

  it('should throw NotFoundException when the variation does not exist', async () => {
    variationRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).rejects.toThrow(
      new NotFoundException(PRODUCT_VARIATION_MESSAGES.NOT_FOUND),
    );
  });

  it('should replace the variation attributes', async () => {
    const result = await repository.replaceAttributes('variation-1', [
      { attributeTypeId: 'attr-1' },
      { attributeTypeId: 'attr-2' },
    ]);

    expect(attributeRepository.delete).toHaveBeenCalledWith({
      variationId: 'variation-1',
    });
    expect(attributeRepository.save).toHaveBeenCalledWith([
      { variationId: 'variation-1', attributeTypeId: 'attr-1' },
      { variationId: 'variation-1', attributeTypeId: 'attr-2' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should only clear the attributes when none are given', async () => {
    const result = await repository.replaceAttributes('variation-1', []);

    expect(attributeRepository.delete).toHaveBeenCalledWith({
      variationId: 'variation-1',
    });
    expect(attributeRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should replace the variation images', async () => {
    const image = { url: 'https://cdn/1.jpg', alt: 'Front', sort: 0 };

    const result = await repository.replaceImages('variation-1', [image]);

    expect(imageRepository.delete).toHaveBeenCalledWith({
      variationId: 'variation-1',
    });
    expect(imageRepository.save).toHaveBeenCalledWith([
      { variationId: 'variation-1', ...image },
    ]);
    expect(result).toHaveLength(1);
  });

  it('should only clear the images when none are given', async () => {
    const result = await repository.replaceImages('variation-1', []);

    expect(imageRepository.delete).toHaveBeenCalledWith({
      variationId: 'variation-1',
    });
    expect(imageRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
