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
import { CreateVariationTypeDto } from '../../dto/create-variation-type.dto';
import { ListVariationTypesQueryDto } from '../../dto/list-variation-types-query.dto';
import { UpdateVariationTypeDto } from '../../dto/update-variation-type.dto';
import { VariationTypesService } from '../../services/variation-types/variation-types.service';

@Controller('catalog/variation-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VariationTypesController {
  constructor(private readonly variationTypesService: VariationTypesService) {}

  @Get()
  @Roles('admin', 'super')
  async listVariationTypes(@Query() query: ListVariationTypesQueryDto) {
    return this.variationTypesService.listVariationTypes(query);
  }

  @Post()
  @Roles('admin', 'super')
  async createVariationType(@Body() dto: CreateVariationTypeDto) {
    return this.variationTypesService.createVariationType(dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  async updateVariationType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVariationTypeDto,
  ) {
    return this.variationTypesService.updateVariationType(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeVariationType(@Param('id', ParseUUIDPipe) id: string) {
    return this.variationTypesService.removeVariationType(id);
  }
}
