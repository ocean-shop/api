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
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @Roles('super')
  async listAdmins(@Query() query: ListAdminsQueryDto) {
    return this.adminsService.listAdmins(query);
  }

  @Get(':id')
  @Roles('super')
  async getAdminById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.getAdminById(id);
  }

  @Post()
  @Roles('super')
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminsService.createAdmin(dto);
  }

  @Patch(':id')
  @Roles('super')
  async updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminsService.updateAdmin(id, dto, request.user?.sub);
  }

  @Delete(':id')
  @Roles('super')
  async removeAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminsService.removeAdmin(id, request.user?.sub);
  }
}
