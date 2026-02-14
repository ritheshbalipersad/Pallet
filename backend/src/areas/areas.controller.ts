import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../entities/user.entity';
import { AreasService } from './areas.service';

@ApiTags('areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('areas')
export class AreasController {
  constructor(private areas: AreasService) {}

  @Get()
  async list() {
    return this.areas.findAll();
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.areas.findById(id);
  }

  @Post()
  async create(
    @Body() body: { name: string; type?: string; parentAreaId?: number; capacity?: number },
    @CurrentUser() user: User,
  ) {
    return this.areas.create(body, user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; type?: string; parentAreaId?: number; capacity?: number },
    @CurrentUser() user: User,
  ) {
    return this.areas.update(id, body, user.userId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    await this.areas.remove(id, user.userId);
    return { ok: true };
  }
}
