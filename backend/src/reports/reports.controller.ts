import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('area-summary')
  async areaSummary() {
    return this.reports.areaSummary();
  }

  @Get('pallet-status')
  async palletStatus() {
    return this.reports.palletStatus();
  }

  @Get('movement-history')
  async movementHistory(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reports.movementHistory({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('lost-damaged')
  async lostDamaged() {
    return this.reports.lostDamaged();
  }

  @Get('overdue-inbound')
  async overdueInbound() {
    return this.reports.overdueInbound();
  }
}
