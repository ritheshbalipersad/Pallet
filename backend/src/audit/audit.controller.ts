import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';

@ApiTags('audit-log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-log')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit log' })
  async list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('palletBarcode') palletBarcode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audit.find({
      entityType,
      entityId,
      action,
      palletBarcode,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
