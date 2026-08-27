import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { GetShopStatisticQueryDto } from '../../dto/get-shop-statistic-query.dto';
import { StatisticService } from '../../services/statistic/statistic.service';

@Controller('statistic')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Statistics')
@ApiBearerAuth('access-token')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('shop')
  @Roles('admin', 'super')
  @ApiOperation({ summary: 'Get shop statistics' })
  @ApiQuery({ name: 'shopId', required: true, type: String, format: 'uuid' })
  async getShopStatistic(@Query() query: GetShopStatisticQueryDto) {
    return this.statisticService.getShopStatistic(query.shopId);
  }
}
