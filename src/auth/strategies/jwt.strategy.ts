import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // tenant id
  email: string;
  slug: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        category: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant tidak ditemukan');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    return tenant;
  }
}
