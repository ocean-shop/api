import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../../../entities/product-image.entity';
import { Product } from '../../../entities/product.entity';
import { IMAGE_MESSAGES } from '../../../constants/image-messages.constants';
import { PRODUCT_MESSAGES } from '../../../constants/product-messages.constants';
import { UUID_REGEX } from '../../../constants/product-image.constants';
import { PaginatedResult } from '../../../../../core/response/models/response.models';
import { ImagePayload } from '../../../models/product-image.models';
import { SortDirection } from '../../../models/sort.models';
import { ProductFilters } from '../../../models/product.models';
import {
  ProductSortBy,
  ProductSortOrder,
} from '../../../entities/enums/product-sort.enum';
import { ProductQueryRepository } from '../common/product-query.repository';

@Injectable()
export class ProductRepository extends ProductQueryRepository {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {
    super(repository);
  }

  async findAllPaginated(
    filters: ProductFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<Product>> {
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

        if (filters.isPopular !== undefined) {
          query.andWhere('product.isPopular = :isPopular', {
            isPopular: filters.isPopular,
          });
        }
      },
      skip,
      take,
      this.resolveSortOptions(filters.sortBy, filters.sortOrder),
    );
  }

  async findByCategoryIdPaginated(
    categoryId: string,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
    isPopular?: boolean,
  ): Promise<PaginatedResult<Product>> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.categories', 'category')
          .andWhere('category.id = :categoryId', { categoryId });

        if (isPopular !== undefined) {
          query.andWhere('product.isPopular = :isPopular', { isPopular });
        }
      },
      skip,
      take,
      this.resolveSortOptions(sortBy, sortOrder),
    );
  }

  async findByTagIdPaginated(
    tagId: string,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<PaginatedResult<Product>> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.tags', 'tag')
          .andWhere('tag.id = :tagId', { tagId });
      },
      skip,
      take,
      this.resolveSortOptions(sortBy, sortOrder),
    );
  }

  async findByAttributeTypeIdPaginated(
    attributeTypeId: string,
    skip: number,
    take: number,
    sortBy?: ProductSortBy,
    sortOrder?: ProductSortOrder,
  ): Promise<PaginatedResult<Product>> {
    return this.findPaginatedWithRelations(
      (query) => {
        query
          .innerJoin('product.attributes', 'attribute')
          .andWhere('attribute.id = :attributeTypeId', { attributeTypeId });
      },
      skip,
      take,
      this.resolveSortOptions(sortBy, sortOrder),
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
      throw new NotFoundException(PRODUCT_MESSAGES.NOT_FOUND);
    }

    return product;
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

  async findByShopIdAndSlug(
    shopId: string,
    slug: string,
  ): Promise<Product | null> {
    return this.repository.findOne({ where: { shopId, slug } });
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
    images: ImagePayload[],
  ): Promise<ProductImage[]> {
    await this.imageRepository.delete({ productId });

    if (images.length === 0) {
      return [];
    }

    const entities = images.map((image) =>
      this.imageRepository.create({
        productId,
        url: image.url,
        alt: image.alt,
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
      throw new NotFoundException(IMAGE_MESSAGES.NOT_FOUND);
    }

    return byUrl;
  }

  private isUuid(value: string): boolean {
    return UUID_REGEX.test(value);
  }

  async findAdjacentImageSibling(
    image: ProductImage,
    direction: SortDirection,
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
