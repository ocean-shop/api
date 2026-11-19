import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_ROLES } from '../../../user/constants/role.constants';
import { Roles } from '../../../user/decorators/roles/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles/roles.guard';
import type { AuthenticatedRequest } from '../../../user/models/auth-request.models';
import { ListNotificationsQueryDto } from '../../dto/notification/list-notifications-query.dto';
import { ShopNotificationsQueryDto } from '../../dto/notification/shop-notifications-query.dto';
import { NotificationsService } from '../../services/notifications/notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Notifications')
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List shop notifications with read state' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async listNotifications(
    @Query() query: ListNotificationsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.listNotifications(query, request.user);
  }

  @Get('unread-count')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Count unread notifications of a shop' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  async getUnreadCount(
    @Query() query: ShopNotificationsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.getUnreadCount(query.shopId, request.user);
  }

  @Sse('stream')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Live notification stream (Server-Sent Events): "notification" and "heartbeat" events',
  })
  @ApiProduces('text/event-stream')
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  streamNotifications(@Query() query: ShopNotificationsQueryDto) {
    return this.notificationsService.streamNotifications(query.shopId);
  }

  @Patch('read-all')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark every notification of a shop as read' })
  @ApiBody({ type: ShopNotificationsQueryDto })
  async markAllAsRead(
    @Body() dto: ShopNotificationsQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAllAsRead(dto.shopId, request.user);
  }

  @Patch(':id/read')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(id, request.user);
  }
}
