import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from '../../../dto/create-order.dto';
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
