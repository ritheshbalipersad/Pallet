import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../entities/user.entity';
import { PalletsService } from './pallets.service';

@ApiTags('pallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pallets')
export class PalletsController {
  constructor(private pallets: PalletsService) {}

  @Get()
  async list(
    @Query('barcode') barcode?: string,
    @Query('currentAreaId') currentAreaId?: string,
    @Query('conditionStatus') conditionStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pallets.findPaginated({
      barcode,
      currentAreaId: currentAreaId ? parseInt(currentAreaId, 10) : undefined,
      conditionStatus,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('lookup')
  async lookup(@Query('barcode') barcode: string) {
    const trimmed = (barcode ?? '').trim();
    if (!trimmed) return { found: false, pallet: null };
    const pallet = await this.pallets.findByBarcode(trimmed);
    if (!pallet) return { found: false, pallet: null };
    return { found: true, pallet };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.pallets.findById(id);
  }

  @Post()
  async create(
    @Body()
    body: {
      barcode: string;
      type?: string;
      size?: string;
      currentAreaId: number;
      owner?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.pallets.create(body, user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      type?: string;
      size?: string;
      conditionStatus?: 'Good' | 'Damaged' | 'Lost' | 'Stolen' | 'Unfit';
      currentAreaId?: number;
      owner?: string;
      statusChangeReason?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.pallets.update(id, body, user.userId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.pallets.softDelete(id, user.userId);
    return { ok: true };
  }
}
