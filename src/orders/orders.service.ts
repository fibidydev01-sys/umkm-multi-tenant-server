import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  QueryOrderDto,
} from './dto';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CREATE ORDER
  // ==========================================
  async create(tenantId: string, dto: CreateOrderDto) {
    // Validate customer if provided
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      });
      if (!customer) {
        throw new BadRequestException('Pelanggan tidak ditemukan');
      }
    }

    // Calculate totals
    const itemsWithSubtotal = dto.items.map((item) => ({
      ...item,
      subtotal: item.price * item.qty,
    }));

    const subtotal = itemsWithSubtotal.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const discount = dto.discount ?? 0;
    const tax = dto.tax ?? 0;
    const total = subtotal - discount + tax;

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        orderNumber,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.PENDING,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        metadata: dto.metadata ?? {},
        items: {
          create: itemsWithSubtotal.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.subtotal,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Update customer stats if customer exists
    if (dto.customerId) {
      await this.prisma.customer.update({
        where: { id: dto.customerId },
        data: {
          totalOrders: { increment: 1 },
        },
      });
    }

    return {
      message: 'Order berhasil dibuat',
      order,
    };
  }

  // ==========================================
  // FIND ALL ORDERS
  // ==========================================
  async findAll(tenantId: string, query: QueryOrderDto) {
    const {
      search,
      status,
      paymentStatus,
      customerId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.OrderWhereInput = { tenantId };

    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          discount: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          customerName: true,
          customerPhone: true,
          createdAt: true,
          customer: {
            select: { id: true, name: true, phone: true },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================
  // FIND ONE ORDER
  // ==========================================
  async findOne(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    return order;
  }

  // ==========================================
  // UPDATE ORDER
  // ==========================================
  async update(tenantId: string, orderId: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException(
        'Tidak dapat mengubah order yang sudah selesai atau dibatalkan',
      );
    }

    // Recalculate total if discount changed
    let total = existing.total;
    if (dto.discount !== undefined) {
      total = existing.subtotal - dto.discount + existing.tax;
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        discount: dto.discount,
        total: dto.discount !== undefined ? total : undefined,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        metadata: dto.metadata,
      },
      include: { items: true },
    });

    return { message: 'Order berhasil diupdate', order };
  }

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================
  async updateStatus(
    tenantId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: dto.status,
    };

    // Set completedAt when status is COMPLETED
    if (dto.status === 'COMPLETED') {
      updateData.completedAt = new Date();

      // Update customer totalSpent
      if (existing.customerId && existing.paymentStatus === 'PAID') {
        await this.prisma.customer.update({
          where: { id: existing.customerId },
          data: { totalSpent: { increment: existing.total } },
        });
      }

      // Reduce stock for products with trackStock
      for (const item of existing.items) {
        if (item.productId) {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { trackStock: true, stock: true },
          });

          if (product?.trackStock) {
            await this.prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.qty } },
            });
          }
        }
      }
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        completedAt: true,
      },
    });

    return { message: `Status order diubah ke ${dto.status}`, order };
  }

  // ==========================================
  // UPDATE PAYMENT STATUS
  // ==========================================
  async updatePaymentStatus(
    tenantId: string,
    orderId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: dto.paymentStatus,
        paidAmount: dto.paidAmount ?? existing.paidAmount,
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        paidAmount: true,
      },
    });

    return {
      message: `Status pembayaran diubah ke ${dto.paymentStatus}`,
      order,
    };
  }

  // ==========================================
  // DELETE/CANCEL ORDER
  // ==========================================
  async remove(tenantId: string, orderId: string) {
    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    if (existing.status === 'COMPLETED') {
      throw new BadRequestException(
        'Tidak dapat menghapus order yang sudah selesai',
      );
    }

    // If order has customer, decrement totalOrders
    if (existing.customerId) {
      await this.prisma.customer.update({
        where: { id: existing.customerId },
        data: { totalOrders: { decrement: 1 } },
      });
    }

    // Delete order (cascade will delete items)
    await this.prisma.order.delete({
      where: { id: orderId },
    });

    return { message: 'Order berhasil dihapus' };
  }

  // ==========================================
  // HELPER: Generate Order Number
  // ==========================================
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Count orders today for this tenant
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.prisma.order.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `ORD-${dateStr}-${sequence}`;
  }
}
