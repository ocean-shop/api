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
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { ChangeCategorySortDto } from '../../dto/change-category-sort.dto';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { ListCategoriesQueryDto } from '../../dto/list-categories-query.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { CategoriesService } from '../../services/categories/categories.service';

@Controller('catalog/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles('admin', 'super')
  async listCategories(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.listCategories(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  async getCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Post()
  @Roles('admin', 'super')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id/sort')
  @Roles('admin', 'super')
  async changeCategorySort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeCategorySortDto,
  ) {
    return this.categoriesService.changeCategorySort(id, dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.removeCategory(id);
  }
}
