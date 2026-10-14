import {
  Body,
  Controller,
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
import { Roles } from '../../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles.guard';
import type { AuthenticatedRequest } from '../../../../user/models/auth-request.models';
import { CreateOrderDto } from '../../../dto/create-order.dto';
import { ListOrdersQueryDto } from '../../../dto/list-orders-query.dto';
import { UpdateOrderPaymentStatusDto } from '../../../dto/update-order-payment-status.dto';
import { UpdateOrderStatusDto } from '../../../dto/update-order-status.dto';
import { OrdersClientService } from '../../../services/orders/client/orders-client.service';

@Controller('orders-client')
@ApiTags('Orders')
export class OrdersClientController {
  constructor(private readonly ordersClientService: OrdersClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create order' })
  @ApiBody({ type: CreateOrderDto })
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersClientService.createOrder(dto);
  }

  @Get('by-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin', 'super')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List orders by user id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listOrdersByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListOrdersQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersClientService.listOrdersByUser(
      userId,
      query,
      request.user,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin', 'super')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersClientService.getOrderById(id, request.user);
  }

  @Patch(':id/payment-status')
  @ApiOperation({ summary: 'Update order payment status' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateOrderPaymentStatusDto })
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderPaymentStatusDto,
  ) {
    return this.ordersClientService.updatePaymentStatus(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersClientService.updateStatus(id, dto);
  }
}
