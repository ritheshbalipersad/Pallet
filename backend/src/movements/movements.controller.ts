import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../entities/user.entity';
import { MovementsService } from './movements.service';

@ApiTags('movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private movements: MovementsService) {}

  @Get()
  async list(
    @Query('palletId') palletId?: string,
    @Query('movementStatus') movementStatus?: string,
    @Query('fromAreaId') fromAreaId?: string,
    @Query('toAreaId') toAreaId?: string,
    @Query('orderBy') orderBy?: 'out_at' | 'in_at' | 'created_at',
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.movements.findPaginated({
      palletId: palletId ? parseInt(palletId, 10) : undefined,
      movementStatus,
      fromAreaId: fromAreaId ? parseInt(fromAreaId, 10) : undefined,
      toAreaId: toAreaId ? parseInt(toAreaId, 10) : undefined,
      orderBy,
      order,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.movements.findById(id);
  }

  @Post()
  async start(
    @Body()
    body: { palletId: number; toAreaId: number; eta?: string; notes?: string },
    @CurrentUser() user: User,
  ) {
    const eta = body.eta ? new Date(body.eta) : undefined;
    return this.movements.startMovement(
      { palletId: body.palletId, toAreaId: body.toAreaId, eta, notes: body.notes },
      user.userId,
    );
  }

  @Post(':id/confirm')
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { notes?: string; inAt?: string },
    @CurrentUser() user: User,
  ) {
    const inAt = body.inAt ? new Date(body.inAt) : undefined;
    return this.movements.confirmMovement(id, user.userId, body.notes, inAt);
  }
}
