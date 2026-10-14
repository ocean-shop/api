import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
  @ApiOperation({
    summary: 'Get user shipping methods by user id (main shipping first)',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  async getShippings(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shippingService.getShippings(userId, request.user);
  }

  @Post(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({
    summary:
      'Create user shipping method by user id. If isMain is true, the previous main shipping is unset; the first shipping is always main.',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: CreateShippingDto })
  async createShipping(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateShippingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shippingService.createShipping(userId, dto, request.user);
  }

  @Patch(':userId/:shippingId/main')
  @Roles('user', 'admin', 'super')
  @ApiOperation({
    summary:
      'Make user shipping method main by id. The previous main shipping is unset.',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiParam({ name: 'shippingId', type: String, format: 'uuid' })
  async setMainShipping(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('shippingId', ParseUUIDPipe) shippingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shippingService.setMainShipping(
      userId,
      shippingId,
      request.user,
    );
  }

  @Delete(':userId/:shippingId')
  @Roles('user', 'admin', 'super')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove user shipping method by id. If it was main, the most recent remaining shipping becomes main.',
  })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiParam({ name: 'shippingId', type: String, format: 'uuid' })
  async removeShipping(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('shippingId', ParseUUIDPipe) shippingId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.shippingService.removeShipping(userId, shippingId, request.user);
  }
}
