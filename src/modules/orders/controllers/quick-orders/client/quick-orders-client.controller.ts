import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateQuickOrderDto } from '../../../dto/quick-orders/create-quick-order.dto';
import { QuickOrdersClientService } from '../../../services/quick-orders/client/quick-orders-client.service';

@Controller('quick-orders-client')
@ApiTags('Quick Orders')
export class QuickOrdersClientController {
  constructor(
    private readonly quickOrdersClientService: QuickOrdersClientService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create "buy in one click" order' })
  @ApiBody({ type: CreateQuickOrderDto })
  async createQuickOrder(@Body() dto: CreateQuickOrderDto) {
    return this.quickOrdersClientService.createQuickOrder(dto);
  }
}
