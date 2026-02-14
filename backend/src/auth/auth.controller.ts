import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '../entities/user.entity';

class LoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login (JWT)' })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Current user profile' })
  async profile(@CurrentUser() user: User) {
    const role = user.role
      ? { roleId: user.role.roleId, name: user.role.name, permissions: user.role.permissions }
      : null;
    return {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      roleId: user.roleId,
      role,
      isActive: user.isActive,
    };
  }
}
