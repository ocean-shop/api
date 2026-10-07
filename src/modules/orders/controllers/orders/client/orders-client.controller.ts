import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../user/guards/roles.guard';
import { CreateOrderDto } from '../../../dto/create-order.dto';
import { UpdateOrderPaymentStatusDto } from '../../../dto/update-order-payment-status.dto';
import { UpdateOrderStatusDto } from '../../../dto/update-order-status.dto';
import { OrdersClientService } from '../../../services/orders/client/orders-client.service';

@Controller('orders-client')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Orders')
@ApiBearerAuth('access-token')
export class OrdersClientController {
  constructor(private readonly ordersClientService: OrdersClientService) {}

  @Post()
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Create order' })
  @ApiBody({ type: CreateOrderDto })
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersClientService.createOrder(dto);
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
    return this.ordersClientService.updatePaymentStatus(id, dto);
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
    return this.ordersClientService.updateStatus(id, dto);
  }
}
