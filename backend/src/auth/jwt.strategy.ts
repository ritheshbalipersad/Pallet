import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const userId = typeof payload.sub === 'number' ? payload.sub : parseInt(String(payload.sub), 10);
    if (Number.isNaN(userId)) throw new UnauthorizedException();
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
