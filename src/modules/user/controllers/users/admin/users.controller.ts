import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../decorators/roles.decorator';
import { ADMIN_ROLES } from '../../../constants/role.constants';
import { ListUsersByShopQueryDto } from '../../../dto/list-users-by-shop-query.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { UsersService } from '../../../services/users/users.service';

@Controller('user/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List users by shop' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUsersByShop(@Query() query: ListUsersByShopQueryDto) {
    return this.usersService.getUsersByShop(query);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get user details by id' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getUserDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserDetails(id);
  }
}
