import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { DashboardQueryDto } from '../../../../dto/dashboard-query.dto';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../../decorators/roles.decorator';
import { ALL_ROLES } from '../../../../constants/role.constants';
import type { AuthenticatedRequest } from '../../../../models/auth-request.models';

@Controller('user/client/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User Client Dashboard')
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':userId')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary:
      'Get user dashboard by user id: last 3 active orders, orders counts, favorite products count, main shipping and last 4 favorite products',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  async getDashboard(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: DashboardQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.dashboardService.getDashboard(userId, query, request.user);
  }
}
