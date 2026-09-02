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
        variations: {
          attributes: {
            attributeType: true,
          },
          images: true,
        },
      },
      order: {
        images: { sort: 'ASC' },
        variations: {
          createdAt: 'ASC',
          images: { sort: 'ASC' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Продукт не знайдено');
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
    const baseQuery = this.buildBasePaginatedQuery();
    applyFilters(baseQuery);

    const total = await this.countPaginatedResults(baseQuery);
    const ids = await this.findPageIds(
      baseQuery,
      skip,
      take,
      sortBy,
      sortOrder,
    );
    if (ids.length === 0) {
      return { items: [], total };
    }

    return {
      items: await this.findProductsWithRelationsInOrder(ids),
      total,
    };
  }

  private buildBasePaginatedQuery(): SelectQueryBuilder<Product> {
    return this.repository.createQueryBuilder('product').distinct(true);
  }

  private async countPaginatedResults(
    query: SelectQueryBuilder<Product>,
  ): Promise<number> {
    return query.clone().getCount();
  }

  private async findPageIds(
    query: SelectQueryBuilder<Product>,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<string[]> {
    const { orderByColumn, orderDirection } = this.resolveSortOptions(
      sortBy,
      sortOrder,
    );

    const idRows = await query
      .clone()
      .select('product.id', 'id')
      .addSelect(orderByColumn, 'sortValue')
      .orderBy(orderByColumn, orderDirection)
      .offset(skip)
      .limit(take)
      .getRawMany<{ id: string; sortValue: string }>();

    return idRows.map((row) => row.id);
  }

  private resolveSortOptions(
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): {
    orderByColumn: string;
    orderDirection: 'ASC' | 'DESC';
  } {
    return {
      orderByColumn:
        sortBy === ProductSortBy.NAME ? 'product.name' : 'product.createdAt',
      orderDirection: sortOrder === ProductSortOrder.ASC ? 'ASC' : 'DESC',
    };
  }

  private async findProductsWithRelationsInOrder(
    ids: string[],
  ): Promise<Product[]> {
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

    return ids
      .map((id) => itemsById.get(id))
      .filter((item): item is Product => item !== undefined);
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

  async findImageById(id: string): Promise<ProductImage> {
    const normalizedId = decodeURIComponent(id);
    const image = this.isUuid(normalizedId)
      ? await this.imageRepository.findOne({ where: { id: normalizedId } })
      : null;

    if (image) {
      return image;
    }

    const byUrl = await this.imageRepository
      .createQueryBuilder('image')
      .where('image.url = :identifier', { identifier: normalizedId })
      .orWhere('image.url LIKE :suffixIdentifier', {
        suffixIdentifier: `%/${normalizedId}`,
      })
      .getOne();

    if (!byUrl) {
      throw new NotFoundException('Зображення продукта не знайдено');
    }

    return byUrl;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  async findAdjacentImageSibling(
    image: ProductImage,
    direction: 'up' | 'down',
  ): Promise<ProductImage | null> {
    const query = this.imageRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId: image.productId })
      .andWhere(
        direction === 'up' ? 'image.sort < :sort' : 'image.sort > :sort',
        { sort: image.sort },
      )
      .orderBy('image.sort', direction === 'up' ? 'DESC' : 'ASC')
      .addOrderBy('image.createdAt', direction === 'up' ? 'DESC' : 'ASC');

    return query.getOne();
  }

  async swapImageSort(
    current: ProductImage,
    sibling: ProductImage,
  ): Promise<ProductImage> {
    const currentSort = current.sort;
    current.sort = sibling.sort;
    sibling.sort = currentSort;

    await this.imageRepository.save([current, sibling]);
    return this.findImageById(current.id);
  }

  async removeImage(image: ProductImage): Promise<ProductImage> {
    return this.imageRepository.remove(image);
  }
}
