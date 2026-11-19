import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { SORT_ORDERS } from '../../../../../core/response/constants/sort.constants';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { ADMIN_ROLES } from '../../../../user/constants/role.constants';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles/roles.guard';
import { ListQuickOrdersQueryDto } from '../../../dto/quick-orders/list-quick-orders-query.dto';
import { UpdateQuickOrderDto } from '../../../dto/quick-orders/update-quick-order.dto';
import { QuickOrderStatus } from '../../../entities/enums/quick-order.enum';
import { QuickOrdersService } from '../../../services/quick-orders/admin/quick-orders.service';

@Controller('quick-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Quick Orders')
@ApiBearerAuth('access-token')
export class QuickOrdersController {
  constructor(private readonly quickOrdersService: QuickOrdersService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List "buy in one click" orders of a shop' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: QuickOrderStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SORT_ORDERS })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listQuickOrders(@Query() query: ListQuickOrdersQueryDto) {
    return this.quickOrdersService.listQuickOrders(query);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get "buy in one click" order by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getQuickOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.quickOrdersService.getQuickOrderById(id);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update "buy in one click" order' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateQuickOrderDto })
  async updateQuickOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuickOrderDto,
  ) {
    return this.quickOrdersService.updateQuickOrder(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Delete "buy in one click" order by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeQuickOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.quickOrdersService.removeQuickOrder(id);
  }
}
