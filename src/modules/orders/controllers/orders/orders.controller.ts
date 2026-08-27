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
import { CreateOrderDto } from '../../dto/create-order.dto';
import { ListOrdersByUserQueryDto } from '../../dto/list-orders-by-user-query.dto';
import { ListOrdersQueryDto } from '../../dto/list-orders-query.dto';
import { UpdateOrderPaymentStatusDto } from '../../dto/update-order-payment-status.dto';
import { UpdateOrderStatusDto } from '../../dto/update-order-status.dto';
import { OrdersService } from '../../services/orders/orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Orders')
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List orders with filters and pagination' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listOrders(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.listOrders(query);
  }

  @Get('by-user')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'List orders by user id' })
  @ApiQuery({ name: 'userId', required: true, type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listOrdersByUser(@Query() query: ListOrdersByUserQueryDto) {
    return this.ordersService.listOrdersByUser(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create order' })
  @ApiBody({ type: CreateOrderDto })
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Delete(':id')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Delete order by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async removeOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.removeOrder(id);
  }

  @Patch(':id/payment-status')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Update order payment status' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateOrderPaymentStatusDto })
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderPaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
