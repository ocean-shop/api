import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { ChangeCategorySortDto } from '../../dto/categories/change-category-sort.dto';
import { CreateCategoryDto } from '../../dto/categories/create-category.dto';
import { ListCategoriesQueryDto } from '../../dto/categories/list-categories-query.dto';
import { UpdateCategoryDto } from '../../dto/categories/update-category.dto';
import { CategoriesService } from '../../services/categories/categories.service';

@Controller('catalog/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Categories')
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List categories with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listCategories(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.listCategories(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Get category details by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create category' })
  @ApiBody({ type: CreateCategoryDto })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id/sort')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Change category sort order' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ChangeCategorySortDto })
  async changeCategorySort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeCategorySortDto,
  ) {
    return this.categoriesService.changeCategorySort(id, dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateCategoryDto })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Delete category by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.removeCategory(id);
  }
}
