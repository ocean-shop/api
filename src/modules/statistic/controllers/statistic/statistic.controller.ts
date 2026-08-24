import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../../user/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/guards/roles.guard';
import { GetShopStatisticQueryDto } from '../../dto/get-shop-statistic-query.dto';
import { StatisticService } from '../../services/statistic/statistic.service';

@Controller('statistic')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get('shop')
  @Roles('admin', 'super')
  async getShopStatistic(@Query() query: GetShopStatisticQueryDto) {
    return this.statisticService.getShopStatistic(query.shopId);
  }
}
