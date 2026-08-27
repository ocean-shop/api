import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateAttributeDto } from '../../dto/attributes/create-attribute.dto';
import { ListAttributesQueryDto } from '../../dto/attributes/list-attributes-query.dto';
import { AttributesService } from '../../services/attributes/attributes.service';

@Controller('catalog/attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Attributes')
@ApiBearerAuth('access-token')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List attributes with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAllAttributes(@Query() query: ListAttributesQueryDto) {
    return this.attributesService.getAllAttributes(query);
  }

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create attribute' })
  @ApiBody({ type: CreateAttributeDto })
  async createAttribute(@Body() dto: CreateAttributeDto) {
    return this.attributesService.createAttribute(dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Delete attribute by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeAttribute(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.removeAttribute(id);
  }
}
