import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto, ChangePasswordDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // PUBLIC: GET BY SLUG (untuk store frontend)
  // ==========================================
  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        slug: true,
        name: true,
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
        // Include public products count
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Toko dengan slug "${slug}" tidak ditemukan`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new NotFoundException(`Toko tidak aktif`);
    }

    return tenant;
  }

  // ==========================================
  // PUBLIC: GET PRODUCTS BY SLUG (untuk store)
  // ==========================================
  async findProductsBySlug(slug: string, category?: string) {
    // First verify tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Toko dengan slug "${slug}" tidak ditemukan`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new NotFoundException(`Toko tidak aktif`);
    }

    // Get products
    const products = await this.prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        ...(category && { category }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        comparePrice: true,
        stock: true,
        trackStock: true,
        unit: true,
        images: true,
        isFeatured: true,
        slug: true,
        metadata: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    return products;
  }

  // ==========================================
  // PROTECTED: GET CURRENT TENANT
  // ==========================================
  async findMe(tenantId: string) {
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
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    return tenant;
  }

  // ==========================================
  // PROTECTED: UPDATE CURRENT TENANT
  // ==========================================
  async updateMe(tenantId: string, dto: UpdateTenantDto) {
    // Check if tenant exists
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    // Update tenant
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name,
        description: dto.description,
        whatsapp: dto.whatsapp,
        phone: dto.phone,
        address: dto.address,
        logo: dto.logo,
        banner: dto.banner,
        theme: dto.theme,
      },
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
        updatedAt: true,
      },
    });

    return {
      message: 'Profil berhasil diupdate',
      tenant,
    };
  }

  // ==========================================
  // PROTECTED: CHANGE PASSWORD
  // ==========================================
  async changePassword(tenantId: string, dto: ChangePasswordDto) {
    // Validate confirm password
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok');
    }

    // Get tenant with password
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, password: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      tenant.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Password lama tidak sesuai');
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      tenant.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'Password baru tidak boleh sama dengan password lama',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password berhasil diubah',
    };
  }

  // ==========================================
  // PROTECTED: GET DASHBOARD STATS
  // ==========================================
  async getDashboardStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get counts and stats
    const [
      totalProducts,
      activeProducts,
      totalCustomers,
      totalOrders,
      ordersToday,
      ordersThisMonth,
      revenueThisMonth,
      lowStockProducts,
    ] = await Promise.all([
      // Total products
      this.prisma.product.count({
        where: { tenantId },
      }),
      // Active products
      this.prisma.product.count({
        where: { tenantId, isActive: true },
      }),
      // Total customers
      this.prisma.customer.count({
        where: { tenantId },
      }),
      // Total orders
      this.prisma.order.count({
        where: { tenantId },
      }),
      // Orders today
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: today },
        },
      }),
      // Orders this month
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
      // Revenue this month
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      // Low stock products
      this.prisma.product.count({
        where: {
          tenantId,
          trackStock: true,
          stock: { lte: this.prisma.product.fields.minStock },
        },
      }),
    ]);

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      customers: {
        total: totalCustomers,
      },
      orders: {
        total: totalOrders,
        today: ordersToday,
        thisMonth: ordersThisMonth,
      },
      revenue: {
        thisMonth: revenueThisMonth._sum.total || 0,
      },
      alerts: {
        lowStock: lowStockProducts,
      },
    };
  }

  // ==========================================
  // HELPER: Check slug availability
  // ==========================================
  async checkSlugAvailability(slug: string) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    return {
      slug: slug.toLowerCase(),
      available: !existing,
    };
  }
}
