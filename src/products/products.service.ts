import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  UpdateStockDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CREATE PRODUCT
  // ==========================================
  async create(tenantId: string, dto: CreateProductDto) {
    // Check SKU uniqueness within tenant
    if (dto.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: {
          tenantId_sku: {
            tenantId,
            sku: dto.sku,
          },
        },
      });

      if (existingSku) {
        throw new ConflictException(`SKU "${dto.sku}" sudah digunakan`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        sku: dto.sku,
        price: dto.price,
        comparePrice: dto.comparePrice,
        costPrice: dto.costPrice,
        stock: dto.stock ?? 0,
        minStock: dto.minStock ?? 0,
        trackStock: dto.trackStock ?? false,
        unit: dto.unit,
        images: dto.images ?? [],
        metadata: dto.metadata ?? {},
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
      },
    });

    return {
      message: 'Produk berhasil ditambahkan',
      product,
    };
  }

  // ==========================================
  // FIND ALL PRODUCTS (with filters & pagination)
  // ==========================================
  async findAll(tenantId: string, query: QueryProductDto) {
    const {
      search,
      category,
      isActive,
      isFeatured,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      tenantId,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Active filter
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Featured filter
    if (typeof isFeatured === 'boolean') {
      where.isFeatured = isFeatured;
    }

    // Low stock filter
    if (lowStock === true) {
      where.trackStock = true;
      where.stock = {
        lte: this.prisma.product.fields.minStock,
      };
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          sku: true,
          price: true,
          comparePrice: true,
          costPrice: true,
          stock: true,
          minStock: true,
          trackStock: true,
          unit: true,
          images: true,
          metadata: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================
  // FIND ONE PRODUCT
  // ==========================================
  async findOne(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId, // Tenant isolation
      },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    return product;
  }

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================
  async update(tenantId: string, productId: string, dto: UpdateProductDto) {
    // Check if product exists and belongs to tenant
    const existing = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    // Check SKU uniqueness if updating SKU
    if (dto.sku && dto.sku !== existing.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          tenantId,
          sku: dto.sku,
          id: { not: productId },
        },
      });

      if (existingSku) {
        throw new ConflictException(`SKU "${dto.sku}" sudah digunakan`);
      }
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        sku: dto.sku,
        price: dto.price,
        comparePrice: dto.comparePrice,
        costPrice: dto.costPrice,
        stock: dto.stock,
        minStock: dto.minStock,
        trackStock: dto.trackStock,
        unit: dto.unit,
        images: dto.images,
        metadata: dto.metadata,
        isActive: dto.isActive,
        isFeatured: dto.isFeatured,
      },
    });

    return {
      message: 'Produk berhasil diupdate',
      product,
    };
  }

  // ==========================================
  // DELETE PRODUCT
  // ==========================================
  async remove(tenantId: string, productId: string) {
    // Check if product exists and belongs to tenant
    const existing = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    // Check if product is used in orders
    const ordersWithProduct = await this.prisma.orderItem.count({
      where: { productId },
    });

    if (ordersWithProduct > 0) {
      // Soft delete - just deactivate
      await this.prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });

      return {
        message: 'Produk dinonaktifkan karena sudah ada di order',
        softDeleted: true,
      };
    }

    // Hard delete
    await this.prisma.product.delete({
      where: { id: productId },
    });

    return {
      message: 'Produk berhasil dihapus',
      softDeleted: false,
    };
  }

  // ==========================================
  // UPDATE STOCK
  // ==========================================
  async updateStock(tenantId: string, productId: string, dto: UpdateStockDto) {
    // Check if product exists and belongs to tenant
    const existing = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        trackStock: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    if (!existing.trackStock) {
      throw new BadRequestException(
        'Produk ini tidak menggunakan tracking stok',
      );
    }

    const newStock = (existing.stock ?? 0) + dto.quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Stok tidak mencukupi. Stok saat ini: ${existing.stock}`,
      );
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
      },
    });

    return {
      message:
        dto.quantity > 0
          ? `Stok berhasil ditambah ${dto.quantity}`
          : `Stok berhasil dikurangi ${Math.abs(dto.quantity)}`,
      product,
      previousStock: existing.stock,
      adjustment: dto.quantity,
      reason: dto.reason,
    };
  }

  // ==========================================
  // TOGGLE ACTIVE STATUS
  // ==========================================
  async toggleActive(tenantId: string, productId: string) {
    // Check if product exists and belongs to tenant
    const existing = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: !existing.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return {
      message: product.isActive
        ? 'Produk berhasil diaktifkan'
        : 'Produk berhasil dinonaktifkan',
      product,
    };
  }

  // ==========================================
  // GET CATEGORIES (unique categories for filter)
  // ==========================================
  async getCategories(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    const categories = products
      .map((p) => p.category)
      .filter((c): c is string => c !== null);

    return { categories };
  }

  // ==========================================
  // GET LOW STOCK PRODUCTS
  // ==========================================
  async getLowStock(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        trackStock: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        unit: true,
      },
    });

    // Filter products where stock <= minStock
    const lowStockProducts = products.filter(
      (p) => (p.stock ?? 0) <= (p.minStock ?? 0),
    );

    return {
      count: lowStockProducts.length,
      products: lowStockProducts,
    };
  }
}
