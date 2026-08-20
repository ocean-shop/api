import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../decorators/roles.decorator';
import { ListUsersByShopQueryDto } from '../../dto/list-users-by-shop-query.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { UsersService } from '../../services/users/users.service';

@Controller('user/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'super')
  async getUsersByShop(@Query() query: ListUsersByShopQueryDto) {
    return this.usersService.getUsersByShop(query);
  }

  @Get(':id')
  @Roles('admin', 'super')
  async getUserDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserDetails(id);
  }
}
