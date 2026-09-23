import { Injectable } from '@nestjs/common';
import { ListCategoriesQueryDto } from '../../../dto/categories/list-categories-query.dto';
import {
  resolvePagination,
  toListResponse,
} from '../../../helpers/list-response.helpers';
import { CategoryListResponse } from '../../../models/category.models';
import { CategoryClientRepository } from '../../../repositories/category/client/category-client.repository';

@Injectable()
export class CategoriesClientService {
  constructor(
    private readonly categoryClientRepository: CategoryClientRepository,
  ) {}

  async listCategories(
    query: ListCategoriesQueryDto,
  ): Promise<CategoryListResponse> {
    const { page, limit, skip } = resolvePagination(query);

    const { items, total } =
      await this.categoryClientRepository.findAllPaginated(
        { shopId: query.shopId, parentId: query.parentId },
        skip,
        limit,
      );

    return toListResponse(items, total, page, limit);
  }
}
