import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ==========================================
  // REGISTER
  // ==========================================
  async register(dto: RegisterDto) {
    // Check if slug already exists
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Slug "${dto.slug}" sudah digunakan. Pilih slug lain.`,
      );
    }

    // Check if email already exists
    const existingEmail = await this.prisma.tenant.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.slug.toLowerCase(),
        name: dto.name,
        category: dto.category,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        whatsapp: dto.whatsapp,
        description: dto.description,
        phone: dto.phone,
        address: dto.address,
        status: TenantStatus.ACTIVE,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        category: true,
        whatsapp: true,
        description: true,
        phone: true,
        address: true,
        logo: true,
        banner: true,
        theme: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const token = this.generateToken(tenant.id, tenant.email, tenant.slug);

    return {
      message: 'Registrasi berhasil',
      access_token: token,
      tenant,
    };
  }

  // ==========================================
  // LOGIN
  // ==========================================
  async login(dto: LoginDto) {
    // Find tenant by email
    const tenant = await this.prisma.tenant.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!tenant) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Check password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const isPasswordValid = await bcrypt.compare(dto.password, tenant.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Check status
    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Akun tidak aktif. Hubungi admin untuk informasi lebih lanjut.',
      );
    }

    // Generate JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const token = this.generateToken(tenant.id, tenant.email, tenant.slug);

    // Return without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...tenantWithoutPassword } = tenant;

    return {
      message: 'Login berhasil',
      access_token: token,
      tenant: tenantWithoutPassword,
    };
  }

  // ==========================================
  // GET CURRENT TENANT (ME)
  // ==========================================
  async me(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        category: true,
        description: true,
        whatsapp: true,
        phone: true,
        address: true,
        logo: true,
        banner: true,
        theme: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            customers: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant tidak ditemukan');
    }

    return tenant;
  }

  // ==========================================
  // HELPER: GENERATE TOKEN
  // ==========================================
  private generateToken(tenantId: string, email: string, slug: string): string {
    const payload = {
      sub: tenantId,
      email,
      slug,
    };

    return this.jwtService.sign(payload);
  }

  // ==========================================
  // VALIDATE TENANT (for guards)
  // ==========================================
  async validateTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        category: true,
        status: true,
      },
    });

    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      return null;
    }

    return tenant;
  }
}
