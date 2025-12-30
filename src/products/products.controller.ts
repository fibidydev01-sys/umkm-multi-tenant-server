import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  UpdateStockDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard) // All endpoints require auth
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /**
   * Create new product
   * POST /api/products
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto);
  }

  /**
   * Get all products (with filters & pagination)
   * GET /api/products
   * Query params: search, category, isActive, isFeatured, lowStock, sortBy, sortOrder, page, limit
   */
  @Get()
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  /**
   * Get product categories (for filter dropdown)
   * GET /api/products/categories
   */
  @Get('categories')
  async getCategories(@CurrentTenant('id') tenantId: string) {
    return this.productsService.getCategories(tenantId);
  }

  /**
   * Get low stock products
   * GET /api/products/low-stock
   */
  @Get('low-stock')
  async getLowStock(@CurrentTenant('id') tenantId: string) {
    return this.productsService.getLowStock(tenantId);
  }

  /**
   * Get single product
   * GET /api/products/:id
   */
  @Get(':id')
  async findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('id') productId: string,
  ) {
    return this.productsService.findOne(tenantId, productId);
  }

  /**
   * Update product
   * PATCH /api/products/:id
   */
  @Patch(':id')
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, productId, dto);
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  @Delete(':id')
  async remove(
    @CurrentTenant('id') tenantId: string,
    @Param('id') productId: string,
  ) {
    return this.productsService.remove(tenantId, productId);
  }

  /**
   * Update stock only
   * PATCH /api/products/:id/stock
   */
  @Patch(':id/stock')
  async updateStock(
    @CurrentTenant('id') tenantId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateStock(tenantId, productId, dto);
  }

  /**
   * Toggle active status
   * PATCH /api/products/:id/toggle
   */
  @Patch(':id/toggle')
  async toggleActive(
    @CurrentTenant('id') tenantId: string,
    @Param('id') productId: string,
  ) {
    return this.productsService.toggleActive(tenantId, productId);
  }
}
