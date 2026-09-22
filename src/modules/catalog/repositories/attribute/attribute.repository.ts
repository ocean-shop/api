import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../../entities/attribute.entity';
import { ProductStatus } from '../../entities/enums/product.enum';

@Injectable()
export class AttributeRepository {
  constructor(
    @InjectRepository(Attribute)
    private readonly repository: Repository<Attribute>,
  ) {}

  async findById(id: string): Promise<Attribute> {
    const attribute = await this.repository.findOne({ where: { id } });

    if (!attribute) {
      throw new NotFoundException('Атрибут не знайдено');
    }

    return attribute;
  }

  async findAllPaginated(
    name: string | undefined,
    shopId: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ items: Attribute[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('attribute')
      .orderBy('attribute.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (name) {
      query.andWhere('attribute.name ILIKE :name', { name: `%${name}%` });
    }

    if (shopId) {
      query.andWhere('attribute.shopId = :shopId', { shopId });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findCategoryFilterOptions(
    categoryId: string,
  ): Promise<Array<{ name: string; value: string }>> {
    return this.repository
      .createQueryBuilder('attribute')
      .select('attribute.name', 'name')
      .addSelect('attribute.value', 'value')
      .distinct(true)
      .where(
        `attribute.id IN (
          SELECT pa.attribute_type_id
          FROM products_categories pc
          INNER JOIN products p ON p.id = pc.product_id
          INNER JOIN products_attributes pa ON pa.product_id = p.id
          WHERE pc.category_id = :categoryId AND p.status = :status
          UNION
          SELECT va.attribute_type_id
          FROM products_categories pc
          INNER JOIN products p ON p.id = pc.product_id
          INNER JOIN product_variations pv ON pv.product_id = p.id
          INNER JOIN variations_attributes va ON va.variation_id = pv.id
          WHERE pc.category_id = :categoryId AND p.status = :status
        )`,
        { categoryId, status: ProductStatus.ACTIVE },
      )
      .andWhere('attribute.value IS NOT NULL')
      .andWhere("attribute.value <> ''")
      .orderBy('attribute.name', 'ASC')
      .addOrderBy('attribute.value', 'ASC')
      .getRawMany<{ name: string; value: string }>();
  }

  create(payload: Partial<Attribute>): Attribute {
    return this.repository.create(payload);
  }

  async save(attribute: Attribute): Promise<Attribute> {
    return this.repository.save(attribute);
  }

  async remove(attribute: Attribute): Promise<Attribute> {
    return this.repository.remove(attribute);
  }
}
