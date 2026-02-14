import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const user = await this.users.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  @Post()
  async create(
    @Body()
    body: {
      username: string;
      password: string;
      displayName?: string;
      email?: string;
      roleId: number;
    },
  ) {
    return this.users.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { displayName?: string; email?: string; roleId?: number; isActive?: boolean; password?: string },
  ) {
    return this.users.update(id, body);
  }
}
