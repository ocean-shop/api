import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariation } from '../../entities/product-variation.entity';
import { VariationAttribute } from '../../entities/variation-attribute.entity';
import { VariationImage } from '../../entities/variation-image.entity';

@Injectable()
export class ProductVariationRepository {
  constructor(
    @InjectRepository(ProductVariation)
    private readonly repository: Repository<ProductVariation>,
    @InjectRepository(VariationAttribute)
    private readonly attributeRepository: Repository<VariationAttribute>,
    @InjectRepository(VariationImage)
    private readonly imageRepository: Repository<VariationImage>,
  ) {}

  create(payload: Partial<ProductVariation>): ProductVariation {
    return this.repository.create(payload);
  }

  async save(variation: ProductVariation): Promise<ProductVariation> {
    return this.repository.save(variation);
  }

  async findById(id: string): Promise<ProductVariation> {
    const variation = await this.repository.findOne({
      where: { id },
      relations: { attributes: { attributeType: true }, images: true },
      order: { images: { sort: 'ASC' } },
    });

    if (!variation) {
      throw new NotFoundException('Варіацію продукта не знайдено');
    }

    return variation;
  }

  async replaceAttributes(
    variationId: string,
    attributes: Array<{ attributeTypeId: string }>,
  ): Promise<VariationAttribute[]> {
    await this.attributeRepository.delete({ variationId });

    if (attributes.length === 0) {
      return [];
    }

    const entities = attributes.map((attribute) =>
      this.attributeRepository.create({
        variationId,
        attributeTypeId: attribute.attributeTypeId,
      }),
    );

    return this.attributeRepository.save(entities);
  }

  async replaceImages(
    variationId: string,
    images: Array<{ url: string; sort: number }>,
  ): Promise<VariationImage[]> {
    await this.imageRepository.delete({ variationId });

    if (images.length === 0) {
      return [];
    }

    const entities = images.map((image) =>
      this.imageRepository.create({
        variationId,
        url: image.url,
        sort: image.sort,
      }),
    );

    return this.imageRepository.save(entities);
  }
}
