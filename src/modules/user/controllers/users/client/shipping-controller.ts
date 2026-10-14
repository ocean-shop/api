import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ShippingService } from '../../../services/shipping/shipping.service';
import { CreateShippingDto } from '../../../dto/create-shipping.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../models/auth-request.models';

@Controller('user/client/shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User Client Shipping')
@ApiBearerAuth('access-token')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({ summary: 'Get user shipping methods by user id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  async getShippings(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shippingService.getShippings(userId, request.user);
  }

  @Post(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({ summary: 'Create user shipping method by user id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: CreateShippingDto })
  async createShipping(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateShippingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shippingService.createShipping(userId, dto, request.user);
  }
}
