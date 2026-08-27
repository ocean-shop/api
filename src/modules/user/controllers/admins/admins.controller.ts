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
  Req,
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
import { CreateAdminDto } from '../../dto/create-admin.dto';
import { ListAdminsQueryDto } from '../../dto/list-admins-query.dto';
import { UpdateAdminDto } from '../../dto/update-admin.dto';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AdminsService } from '../../services/admins/admins.service';
import type { AuthenticatedRequest } from '../../models/auth-request.models';

@Controller('user/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User Admins')
@ApiBearerAuth('access-token')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @Roles('super')
  @ApiOperation({ summary: 'List admins with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listAdmins(@Query() query: ListAdminsQueryDto) {
    return this.adminsService.listAdmins(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Get admin details by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getAdminById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.getAdminById(id);
  }

  @Post()
  @Roles('super')
  @ApiOperation({ summary: 'Create a new admin' })
  @ApiBody({ type: CreateAdminDto })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminsService.createAdmin(dto);
  }

  @Patch(':id')
  @Roles('super')
  @ApiOperation({ summary: 'Update admin profile and permissions' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateAdminDto })
  async updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminsService.updateAdmin(id, dto, request.user?.sub);
  }

  @Delete(':id')
  @Roles('super')
  @ApiOperation({ summary: 'Delete admin by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminsService.removeAdmin(id, request.user?.sub);
  }
}
