import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
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
import { ProfileService } from '../../../services/profile/profile.service';
import { UpdateProfileDto } from '../../../dto/update-profile.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../models/auth-request.models';

@Controller('user/client/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User Client Profile')
@ApiBearerAuth('access-token')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({ summary: 'Get user profile by user id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  async getProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.profileService.getProfile(userId, request.user);
  }

  @Put(':userId')
  @Roles('user', 'admin', 'super')
  @ApiOperation({ summary: 'Create or update user profile by user id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateProfileDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.profileService.updateProfile(userId, dto, request.user);
  }
}
