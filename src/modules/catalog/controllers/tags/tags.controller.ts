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
import { CreateTagDto } from '../../dto/tags/create-tag.dto';
import { ListTagsQueryDto } from '../../dto/tags/list-tags-query.dto';
import { UpdateTagDto } from '../../dto/tags/update-tag.dto';
import { TagsService } from '../../services/tags/tags.service';

@Controller('catalog/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Tags')
@ApiBearerAuth('access-token')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List tags with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listTags(@Query() query: ListTagsQueryDto) {
    return this.tagsService.listTags(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Get tag by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getTagById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.getTagById(id);
  }

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create tag' })
  @ApiBody({ type: CreateTagDto })
  async createTag(@Body() dto: CreateTagDto) {
    return this.tagsService.createTag(dto);
  }

  @Patch(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Update tag' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateTagDto })
  async updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tagsService.updateTag(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Delete tag by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.removeTag(id);
  }
}
