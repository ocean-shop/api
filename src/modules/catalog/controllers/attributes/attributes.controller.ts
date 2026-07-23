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
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { CreateAttributeDto } from '../../dto/create-attribute.dto';
import { ListAttributesQueryDto } from '../../dto/list-attributes-query.dto';
import { AttributesService } from '../../services/attributes/attributes.service';

@Controller('catalog/attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @Roles('admin', 'super')
  async getAllAttributes(@Query() query: ListAttributesQueryDto) {
    return this.attributesService.getAllAttributes(query);
  }

  @Post()
  @Roles('admin', 'super')
  async createAttribute(@Body() dto: CreateAttributeDto) {
    return this.attributesService.createAttribute(dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeAttribute(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.removeAttribute(id);
  }
}
