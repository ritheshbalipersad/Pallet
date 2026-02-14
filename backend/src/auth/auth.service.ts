import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.isActive) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) throw new UnauthorizedException('Invalid username or password');
    return this.tokenResponse(user);
  }

  tokenResponse(user: User) {
    const payload = { sub: user.userId, username: user.username };
    const access_token = this.jwtService.sign(payload);
    const role = user.role
      ? { roleId: user.role.roleId, name: user.role.name, permissions: user.role.permissions }
      : null;
    return {
      access_token,
      user: {
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        roleId: user.roleId,
        role,
        isActive: user.isActive,
      },
    };
  }
}
