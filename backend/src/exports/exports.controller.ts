import { Controller, Get, Param, ParseIntPipe, Post, Body, Query, UseGuards, StreamableFile, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../entities/user.entity';
import { ExportsService } from './exports.service';

@ApiTags('exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private exports: ExportsService) {}

  @Post()
  async create(
    @Body() body: { reportType: string; parameters?: Record<string, unknown> },
    @CurrentUser() user: User,
  ) {
    try {
      const exp = await this.exports.create(
        body.reportType ?? '',
        body.parameters ?? {},
        user.userId,
      );
      const exportId = exp?.exportId ?? (exp as { export_id?: number })?.export_id;
      if (exportId != null) {
        setImmediate(() => {
          this.exports.generateCsv(exportId).catch(() =>
            this.exports.setFailed(exportId),
          );
        });
      }
      return exp;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      console.error('[Exports] create failed:', err);
      throw new InternalServerErrorException(message);
    }
  }

  @Get()
  async list(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exports.listByUser(
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const exp = await this.exports.getById(id, user.userId);
    const filePath = this.exports.getFilePath(exp);
    const filename = filePath.split(/[/\\]/).pop() || 'export.csv';
    const file = createReadStream(filePath);
    return new StreamableFile(file, {
      type: 'text/csv',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
