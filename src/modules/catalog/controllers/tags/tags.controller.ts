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
import { CreateTagDto } from '../../dto/create-tag.dto';
import { ListTagsQueryDto } from '../../dto/list-tags-query.dto';
import { UpdateTagDto } from '../../dto/update-tag.dto';
import { TagsService } from '../../services/tags/tags.service';

@Controller('catalog/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Roles('admin', 'super')
  async listTags(@Query() query: ListTagsQueryDto) {
    return this.tagsService.listTags(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  async getTagById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.getTagById(id);
  }

  @Post()
  @Roles('admin', 'super')
  async createTag(@Body() dto: CreateTagDto) {
    return this.tagsService.createTag(dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  async updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagsService.updateTag(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  async removeTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.removeTag(id);
  }
}
