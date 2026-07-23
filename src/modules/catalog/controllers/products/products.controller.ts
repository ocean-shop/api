import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { AssignProductAttributeDto } from '../../dto/assign-product-attribute.dto';
import { AssignProductCategoryDto } from '../../dto/assign-product-category.dto';
import { AssignProductImagesDto } from '../../dto/assign-product-images.dto';
import { AssignProductTagDto } from '../../dto/assign-product-tag.dto';
import { CreateProductDto } from '../../dto/create-product.dto';
import { ListProductsQueryDto } from '../../dto/list-products-query.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductsService } from '../../services/products/products.service';

@Controller('catalog/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('admin', 'super')
  async listProducts(@Query() query: ListProductsQueryDto) {
    return this.productsService.listProducts(query);
  }

  @Get('by-category/:categoryId')
  @Roles('admin', 'super')
  async listProductsByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProductsByCategoryId(categoryId, query);
  }

  @Get('by-tag/:tagId')
  @Roles('admin', 'super')
  async listProductsByTagId(
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProductsByTagId(tagId, query);
  }

  @Get('by-attribute/:attributeTypeId')
  @Roles('admin', 'super')
  async listProductsByAttributeTypeId(
    @Param('attributeTypeId', ParseUUIDPipe) attributeTypeId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProductsByAttributeTypeId(
      attributeTypeId,
      query,
    );
  }

  @Get(':id')
  @Roles('admin', 'super')
  async getProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @Roles('admin', 'super')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.removeProduct(id);
  }

  @Post(':id/categories')
  @Roles('admin', 'super')
  async assignCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductCategoryDto,
  ) {
    return this.productsService.assignCategory(id, dto);
  }

  @Post(':id/tags')
  @Roles('admin', 'super')
  async assignTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductTagDto,
  ) {
    return this.productsService.assignTag(id, dto);
  }

  @Post(':id/attributes')
  @Roles('admin', 'super')
  async assignAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductAttributeDto,
  ) {
    return this.productsService.assignAttribute(id, dto);
  }

  @Put(':id/images')
  @Roles('admin', 'super')
  async assignImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductImagesDto,
  ) {
    return this.productsService.assignImages(id, dto);
  }
}
