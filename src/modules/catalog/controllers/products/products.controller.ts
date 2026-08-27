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
import { AssignProductAttributeDto } from '../../dto/attributes/assign-product-attribute.dto';
import { AssignProductCategoryDto } from '../../dto/products/assign-product-category.dto';
import { AssignProductImagesDto } from '../../dto/products/assign-product-images.dto';
import { AssignProductTagDto } from '../../dto/products/assign-product-tag.dto';
import { ProductVariationDto } from '../../dto/products/product-variation.dto';
import { CreateProductDto } from '../../dto/products/create-product.dto';
import { ListProductsQueryDto } from '../../dto/products/list-products-query.dto';
import { UpdateProductDto } from '../../dto/products/update-product.dto';
import { ProductsService } from '../../services/products/products.service';

@Controller('catalog/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Products')
@ApiBearerAuth('access-token')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listProducts(@Query() query: ListProductsQueryDto) {
    return this.productsService.listProducts(query);
  }

  @Get('by-category/:categoryId')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List products by category id' })
  @ApiParam({ name: 'categoryId', type: String, format: 'uuid' })
  async listProductsByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProductsByCategoryId(categoryId, query);
  }

  @Get('by-tag/:tagId')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List products by tag id' })
  @ApiParam({ name: 'tagId', type: String, format: 'uuid' })
  async listProductsByTagId(
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productsService.listProductsByTagId(tagId, query);
  }

  @Get('by-attribute/:attributeTypeId')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List products by attribute type id' })
  @ApiParam({ name: 'attributeTypeId', type: String, format: 'uuid' })
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
  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({ type: CreateProductDto })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateProductDto })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Delete product by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.removeProduct(id);
  }

  @Post(':id/categories')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Assign category to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignProductCategoryDto })
  async assignCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductCategoryDto,
  ) {
    return this.productsService.assignCategory(id, dto);
  }

  @Post(':id/tags')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Assign tag to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignProductTagDto })
  async assignTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductTagDto,
  ) {
    return this.productsService.assignTag(id, dto);
  }

  @Post(':id/attributes')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Assign attribute to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignProductAttributeDto })
  async assignAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductAttributeDto,
  ) {
    return this.productsService.assignAttribute(id, dto);
  }

  @Put(':id/images')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Assign image list to product' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignProductImagesDto })
  async assignImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignProductImagesDto,
  ) {
    return this.productsService.assignImages(id, dto);
  }

  @Post(':id/variations')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create product variation' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ProductVariationDto })
  async createVariation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProductVariationDto,
  ) {
    return this.productsService.createVariation(id, dto);
  }

  @Patch(':id/variations/:variation_id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Update product variation' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'variation_id', type: String, format: 'uuid' })
  @ApiBody({ type: ProductVariationDto })
  async updateVariation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variation_id', ParseUUIDPipe) variationId: string,
    @Body() dto: ProductVariationDto,
  ) {
    return this.productsService.updateVariation(id, variationId, dto);
  }
}
