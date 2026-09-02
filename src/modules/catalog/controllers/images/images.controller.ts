import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { ChangeProductImageSortDto } from '../../dto/images/change-product-image-sort.dto';
import { ImagesService } from '../../services/images/images.service';

@Controller('catalog/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Images')
@ApiBearerAuth('access-token')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Patch(':id/sort')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Change product image sort order' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Image UUID or image URL/filename identifier',
  })
  @ApiBody({ type: ChangeProductImageSortDto })
  async changeImageSort(
    @Param('id') id: string,
    @Body() dto: ChangeProductImageSortDto,
  ) {
    return this.imagesService.changeImageSort(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Delete image by id' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Image UUID or image URL/filename identifier',
  })
  async removeImage(@Param('id') id: string) {
    return this.imagesService.removeImage(id);
  }
}
