import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { ChangeProductImageSortDto } from '../../dto/images/change-product-image-sort.dto';
import { ImagesService } from '../../services/images/images.service';

@Controller('catalog/images')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Patch(':id/sort')
  @Roles('admin', 'super')
  async changeImageSort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeProductImageSortDto,
  ) {
    return this.imagesService.changeImageSort(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeImage(@Param('id', ParseUUIDPipe) id: string) {
    return this.imagesService.removeImage(id);
  }
}
