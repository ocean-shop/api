import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ProductImage } from '../../entities/product-image.entity';
import { Product } from '../../entities/product.entity';
import {
  ProductFilters,
  ProductSortBy,
  ProductSortOrder,
} from '../../models/product.models';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  async findAllPaginated(
    filters: ProductFilters,
    skip: number,
    take: number,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(
      (query) => {
        if (filters.shopId) {
          query.andWhere('product.shopId = :shopId', {
            shopId: filters.shopId,
          });
        }

        if (filters.status) {
          query.andWhere('product.status = :status', {
            status: filters.status,
          });
        }

        if (filters.name) {
          query.andWhere('product.name ILIKE :name', {
            name: `%${filters.name}%`,
          });
        }

        if (filters.sku) {
          query.andWhere('product.sku ILIKE :sku', {
            sku: `%${filters.sku}%`,
          });
        }

        if (filters.categoryIds && filters.categoryIds.length > 0) {
          query
            .innerJoin('product.categories', 'filteredCategory')
            .andWhere('filteredCategory.id IN (:...categoryIds)', {
              categoryIds: filters.categoryIds,
            });
        }
      },
      skip,
      take,
      filters.sortBy,
      filters.sortOrder,
    );
  }

  async findByCategoryIdPaginated(
    categoryId: string,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.categories', 'category')
          .andWhere('category.id = :categoryId', { categoryId });
      },
      skip,
      take,
      sortBy,
      sortOrder,
    );
  }

  async findByTagIdPaginated(
    tagId: string,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.tags', 'tag')
          .andWhere('tag.id = :tagId', { tagId });
      },
      skip,
      take,
      sortBy,
      sortOrder,
    );
  }

  async findByAttributeTypeIdPaginated(
    attributeTypeId: string,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<{ items: Product[]; total: number }> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.attributes', 'attribute')
          .andWhere('attribute.id = :attributeTypeId', { attributeTypeId });
      },
      skip,
      take,
      sortBy,
      sortOrder,
    );
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id },
      relations: {
        categories: true,
        tags: true,
        attributes: true,
        images: true,
      },
      order: { images: { sort: 'ASC' } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async findPaginatedWithRelations(
    applyFilters: (query: SelectQueryBuilder<Product>) => void,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<{ items: Product[]; total: number }> {
    const baseQuery = this.repository
      .createQueryBuilder('product')
      .distinct(true);
    applyFilters(baseQuery);

    const total = await baseQuery.clone().getCount();

    const orderByColumn =
      sortBy === ProductSortBy.NAME ? 'product.name' : 'product.createdAt';
    const orderDirection = sortOrder === ProductSortOrder.ASC ? 'ASC' : 'DESC';

    const idRows = await baseQuery
      .clone()
      .select('product.id', 'id')
      .addSelect(orderByColumn, 'sortValue')
      .orderBy(orderByColumn, orderDirection)
      .offset(skip)
      .limit(take)
      .getRawMany<{ id: string; sortValue: string }>();

    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) {
      return { items: [], total };
    }

    const items = await this.repository.find({
      where: { id: In(ids) },
      relations: {
        categories: true,
        tags: true,
        attributes: true,
        images: true,
      },
      order: { images: { sort: 'ASC' } },
    });

    const itemsById = new Map(items.map((item) => [item.id, item]));

    return {
      items: ids
        .map((id) => itemsById.get(id))
        .filter((item): item is Product => item !== undefined),
      total,
    };
  }

  async findOneById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByShopIdAndSku(
    shopId: string,
    sku: string,
  ): Promise<Product | null> {
    return this.repository.findOne({ where: { shopId, sku } });
  }

  create(payload: Partial<Product>): Product {
    return this.repository.create(payload);
  }

  async save(product: Product): Promise<Product> {
    return this.repository.save(product);
  }

  async remove(product: Product): Promise<Product> {
    return this.repository.remove(product);
  }

  async replaceImages(
    productId: string,
    images: Array<{ url: string; sort: number }>,
  ): Promise<ProductImage[]> {
    await this.imageRepository.delete({ productId });

    if (images.length === 0) {
      return [];
    }

    const entities = images.map((image) =>
      this.imageRepository.create({
        productId,
        url: image.url,
        sort: image.sort,
      }),
    );

    return this.imageRepository.save(entities);
  }
}
