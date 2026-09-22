import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from '../../services/categories/categories.service';
import { ListCategoriesQueryDto } from '../../dto/categories/list-categories-query.dto';

@Controller('catalog/categories-client')
@ApiTags('Catalog Categories Client')
export class CategoriesClientController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listCategories(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.listCategories(query);
  }
}
