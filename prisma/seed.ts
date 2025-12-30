import {
  PrismaClient,
  TenantStatus,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateOrderNumber(date: Date, index: number): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const indexStr = String(index).padStart(3, '0');
  return `ORD-${dateStr}-${indexStr}`;
}

// ==========================================
// SEED DATA
// ==========================================

async function main() {
  console.log('🌱 Starting complete seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('✅ Database cleaned\n');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==========================================
  // TENANT 1: WARUNG KELONTONG
  // ==========================================
  console.log('📦 Creating Tenant 1: Warung Kelontong...');

  const warung = await prisma.tenant.create({
    data: {
      slug: 'tokosari',
      name: 'Warung Kelontong Pak Sari',
      category: 'WARUNG_KELONTONG',
      description:
        'Warung kelontong lengkap, harga bersahabat. Melayani dengan sepenuh hati sejak 2010.',
      whatsapp: '6281234567001',
      email: 'tokosari@fibidy.com',
      phone: '081234567001',
      address: 'Jl. Merdeka No. 10, RT 05/RW 03, Caruban',
      password: hashedPassword,
      status: TenantStatus.ACTIVE,
      theme: { primaryColor: '#10b981' },
    },
  });

  // Products - Warung
  await prisma.product.createMany({
    data: [
      {
        tenantId: warung.id,
        name: 'Indomie Goreng',
        description: 'Mie goreng instant favorit Indonesia',
        category: 'Mie Instan',
        sku: 'MIE-001',
        price: 3500,
        costPrice: 3000,
        stock: 100,
        minStock: 20,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        isFeatured: true,
        images: [],
        metadata: { barcode: '8991001234567', supplier: 'PT Indofood' },
      },
      {
        tenantId: warung.id,
        name: 'Indomie Kuah Soto',
        description: 'Mie kuah rasa soto khas',
        category: 'Mie Instan',
        sku: 'MIE-002',
        price: 3500,
        costPrice: 3000,
        stock: 80,
        minStock: 20,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
        metadata: { barcode: '8991001234568' },
      },
      {
        tenantId: warung.id,
        name: 'Minyak Goreng Bimoli 2L',
        description: 'Minyak goreng premium untuk masakan sehat',
        category: 'Minyak',
        sku: 'MYK-001',
        price: 38000,
        costPrice: 35000,
        stock: 25,
        minStock: 5,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        isFeatured: true,
        images: [],
        metadata: { barcode: '8991002345678' },
      },
      {
        tenantId: warung.id,
        name: 'Gula Pasir 1kg',
        description: 'Gula pasir putih berkualitas',
        category: 'Sembako',
        sku: 'GLR-001',
        price: 16000,
        costPrice: 14500,
        stock: 40,
        minStock: 10,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
      },
      {
        tenantId: warung.id,
        name: 'Beras Premium 5kg',
        description: 'Beras putih pulen berkualitas',
        category: 'Sembako',
        sku: 'BRS-001',
        price: 75000,
        costPrice: 70000,
        stock: 20,
        minStock: 5,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        isFeatured: true,
        images: [],
      },
      {
        tenantId: warung.id,
        name: 'Kopi Kapal Api Sachet',
        description: 'Kopi hitam sachet nikmat',
        category: 'Minuman',
        sku: 'KPI-001',
        price: 2000,
        costPrice: 1700,
        stock: 200,
        minStock: 50,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
      },
      {
        tenantId: warung.id,
        name: 'Aqua 600ml',
        description: 'Air mineral dalam kemasan',
        category: 'Minuman',
        sku: 'AQA-001',
        price: 4000,
        costPrice: 3200,
        stock: 48,
        minStock: 12,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
      },
      {
        tenantId: warung.id,
        name: 'Teh Botol Sosro 450ml',
        description: 'Teh manis dalam botol',
        category: 'Minuman',
        sku: 'TEH-001',
        price: 5000,
        costPrice: 4200,
        stock: 36,
        minStock: 12,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
      },
      {
        tenantId: warung.id,
        name: 'Sabun Lifebuoy',
        description: 'Sabun mandi antibakteri',
        category: 'Toiletries',
        sku: 'SBN-001',
        price: 4500,
        costPrice: 3800,
        stock: 30,
        minStock: 10,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
      },
      {
        tenantId: warung.id,
        name: 'Rokok Surya 12',
        description: 'Rokok kretek 12 batang',
        category: 'Rokok',
        sku: 'RKK-001',
        price: 25000,
        costPrice: 23000,
        stock: 50,
        minStock: 10,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
      },
    ],
  });

  // Customer - Warung
  const customerWarung = await prisma.customer.create({
    data: {
      tenantId: warung.id,
      name: 'Bu Dewi',
      phone: '081234567101',
      address: 'Jl. Melati No. 5, Caruban',
      metadata: {
        totalDebt: 85000,
        creditLimit: 200000,
        notes: 'Pelanggan tetap, bayar mingguan',
      },
    },
  });

  console.log(`✅ Warung: ${warung.slug} - 10 products, 1 customer`);

  // ==========================================
  // TENANT 2: BENGKEL MOTOR
  // ==========================================
  console.log('🔧 Creating Tenant 2: Bengkel Motor...');

  const bengkel = await prisma.tenant.create({
    data: {
      slug: 'bengkeljaya',
      name: 'Bengkel Jaya Motor',
      category: 'BENGKEL_MOTOR',
      description:
        'Bengkel motor terpercaya. Service ringan hingga berat. Sparepart lengkap.',
      whatsapp: '6281234567002',
      email: 'bengkeljaya@fibidy.com',
      phone: '081234567002',
      address: 'Jl. Raya Madiun No. 45, Caruban',
      password: hashedPassword,
      status: TenantStatus.ACTIVE,
      theme: { primaryColor: '#f97316' },
    },
  });

  // Products (Services) - Bengkel
  await prisma.product.createMany({
    data: [
      {
        tenantId: bengkel.id,
        name: 'Ganti Oli Mesin',
        description: 'Ganti oli mesin + filter oli (oli tidak termasuk)',
        category: 'Service Rutin',
        sku: 'SVC-001',
        price: 25000,
        unit: 'service',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { duration: 15, warranty: 0 },
      },
      {
        tenantId: bengkel.id,
        name: 'Tune Up Lengkap',
        description: 'Service lengkap: busi, filter udara, karburator, rantai',
        category: 'Service Rutin',
        sku: 'SVC-002',
        price: 150000,
        unit: 'service',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { duration: 60, warranty: 7 },
      },
      {
        tenantId: bengkel.id,
        name: 'Ganti Kampas Rem Depan',
        description:
          'Ganti kampas rem depan + stel rem (kampas tidak termasuk)',
        category: 'Rem',
        sku: 'SVC-003',
        price: 35000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 20, warranty: 7 },
      },
      {
        tenantId: bengkel.id,
        name: 'Ganti Ban Dalam',
        description: 'Pasang ban dalam baru (ban tidak termasuk)',
        category: 'Ban',
        sku: 'SVC-004',
        price: 15000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 15, warranty: 0 },
      },
      {
        tenantId: bengkel.id,
        name: 'Tambal Ban Tubeless',
        description: 'Tambal ban tubeless dengan plug',
        category: 'Ban',
        sku: 'SVC-005',
        price: 25000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 10, warranty: 30 },
      },
      {
        tenantId: bengkel.id,
        name: 'Service CVT Matic',
        description: 'Bersih CVT, cek roller, cek v-belt',
        category: 'Transmisi',
        sku: 'SVC-006',
        price: 85000,
        unit: 'service',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { duration: 45, warranty: 7 },
      },
      {
        tenantId: bengkel.id,
        name: 'Oli Yamalube 0.8L',
        description: 'Oli mesin Yamalube 10W-40',
        category: 'Sparepart',
        sku: 'OLI-001',
        price: 45000,
        costPrice: 38000,
        stock: 20,
        minStock: 5,
        trackStock: true,
        unit: 'botol',
        isActive: true,
        images: [],
        metadata: { brand: 'Yamaha' },
      },
      {
        tenantId: bengkel.id,
        name: 'Busi NGK Iridium',
        description: 'Busi NGK Iridium untuk motor matic',
        category: 'Sparepart',
        sku: 'BSI-001',
        price: 75000,
        costPrice: 60000,
        stock: 15,
        minStock: 5,
        trackStock: true,
        unit: 'pcs',
        isActive: true,
        images: [],
        metadata: { brand: 'NGK', type: 'Iridium' },
      },
    ],
  });

  // Customer - Bengkel

  console.log(`✅ Bengkel: ${bengkel.slug} - 8 products, 1 customer`);

  // ==========================================
  // TENANT 3: SALON & BARBERSHOP
  // ==========================================
  console.log('✂️ Creating Tenant 3: Salon Cantik...');

  const salon = await prisma.tenant.create({
    data: {
      slug: 'saloncantik',
      name: 'Salon Cantik Alami',
      category: 'SALON_BARBERSHOP',
      description:
        'Salon kecantikan & barbershop. Potong rambut, creambath, facial, dan perawatan lainnya.',
      whatsapp: '6281234567003',
      email: 'saloncantik@fibidy.com',
      phone: '081234567003',
      address: 'Jl. Ahmad Yani No. 88, Caruban',
      password: hashedPassword,
      status: TenantStatus.ACTIVE,
      theme: { primaryColor: '#ec4899' },
    },
  });

  // Products (Services) - Salon
  await prisma.product.createMany({
    data: [
      {
        tenantId: salon.id,
        name: 'Potong Rambut Pria',
        description: 'Potong rambut pria dewasa',
        category: 'Potong Rambut',
        sku: 'PTG-001',
        price: 25000,
        unit: 'service',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { duration: 20, stylist: 'Semua' },
      },
      {
        tenantId: salon.id,
        name: 'Potong Rambut Wanita',
        description: 'Potong rambut wanita (tanpa cuci & blow)',
        category: 'Potong Rambut',
        sku: 'PTG-002',
        price: 35000,
        unit: 'service',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { duration: 30, stylist: 'Mbak Sari, Mbak Dewi' },
      },
      {
        tenantId: salon.id,
        name: 'Potong + Cuci + Blow',
        description: 'Paket lengkap potong, cuci, dan blow dry',
        category: 'Potong Rambut',
        sku: 'PTG-003',
        price: 60000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 45, stylist: 'Mbak Sari, Mbak Dewi' },
      },
      {
        tenantId: salon.id,
        name: 'Creambath',
        description: 'Creambath dengan vitamin rambut',
        category: 'Perawatan',
        sku: 'CRM-001',
        price: 75000,
        unit: 'service',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { duration: 60, stylist: 'Mbak Dewi' },
      },
      {
        tenantId: salon.id,
        name: 'Hair Spa',
        description: 'Hair spa premium untuk rambut rusak',
        category: 'Perawatan',
        sku: 'SPA-001',
        price: 100000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 75, stylist: 'Mbak Dewi' },
      },
      {
        tenantId: salon.id,
        name: 'Facial Basic',
        description: 'Facial pembersihan wajah dasar',
        category: 'Facial',
        sku: 'FCL-001',
        price: 85000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 60, beautician: 'Mbak Rina' },
      },
      {
        tenantId: salon.id,
        name: 'Cat Rambut',
        description: 'Pewarnaan rambut (cat tidak termasuk)',
        category: 'Coloring',
        sku: 'CLR-001',
        price: 50000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 90, stylist: 'Mbak Sari' },
      },
      {
        tenantId: salon.id,
        name: 'Smoothing Rambut',
        description: 'Treatment smoothing untuk rambut lurus',
        category: 'Treatment',
        sku: 'SMT-001',
        price: 250000,
        unit: 'service',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { duration: 180, stylist: 'Mbak Sari' },
      },
    ],
  });

  // Customer - Salon

  console.log(`✅ Salon: ${salon.slug} - 8 products, 1 customer`);

  // ==========================================
  // TENANT 4: LAUNDRY
  // ==========================================
  console.log('🧺 Creating Tenant 4: Laundry Kilat...');

  const laundry = await prisma.tenant.create({
    data: {
      slug: 'laundrykilat',
      name: 'Laundry Kilat Express',
      category: 'LAUNDRY',
      description:
        'Laundry kiloan express. Cuci setrika wangi. Antar jemput gratis radius 3km.',
      whatsapp: '6281234567004',
      email: 'laundrykilat@fibidy.com',
      phone: '081234567004',
      address: 'Jl. Diponegoro No. 33, Caruban',
      password: hashedPassword,
      status: TenantStatus.ACTIVE,
      theme: { primaryColor: '#3b82f6' },
    },
  });

  // Products (Services) - Laundry
  await prisma.product.createMany({
    data: [
      {
        tenantId: laundry.id,
        name: 'Cuci Setrika Reguler',
        description: 'Cuci + setrika, selesai 3 hari',
        category: 'Kiloan',
        sku: 'LDR-001',
        price: 7000,
        unit: 'kg',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { pricePerKg: 7000, estimatedDays: 3 },
      },
      {
        tenantId: laundry.id,
        name: 'Cuci Setrika Express',
        description: 'Cuci + setrika, selesai 1 hari',
        category: 'Kiloan',
        sku: 'LDR-002',
        price: 12000,
        unit: 'kg',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { pricePerKg: 12000, estimatedDays: 1 },
      },
      {
        tenantId: laundry.id,
        name: 'Cuci Kering (Dry Clean)',
        description: 'Dry cleaning untuk jas, gaun, dll',
        category: 'Satuan',
        sku: 'LDR-003',
        price: 35000,
        unit: 'pcs',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { estimatedDays: 3 },
      },
      {
        tenantId: laundry.id,
        name: 'Setrika Saja',
        description: 'Setrika saja (sudah bersih)',
        category: 'Kiloan',
        sku: 'LDR-004',
        price: 5000,
        unit: 'kg',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { pricePerKg: 5000, estimatedDays: 1 },
      },
      {
        tenantId: laundry.id,
        name: 'Cuci Bed Cover',
        description: 'Cuci bed cover ukuran standar',
        category: 'Satuan',
        sku: 'LDR-005',
        price: 25000,
        unit: 'pcs',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { estimatedDays: 2 },
      },
      {
        tenantId: laundry.id,
        name: 'Cuci Selimut Tebal',
        description: 'Cuci selimut/blanket tebal',
        category: 'Satuan',
        sku: 'LDR-006',
        price: 30000,
        unit: 'pcs',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { estimatedDays: 2 },
      },
      {
        tenantId: laundry.id,
        name: 'Cuci Sepatu',
        description: 'Cuci sepatu sneakers/canvas',
        category: 'Satuan',
        sku: 'LDR-007',
        price: 35000,
        unit: 'pasang',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { estimatedDays: 2 },
      },
    ],
  });

  // Customer - Laundry
  const customerLaundry = await prisma.customer.create({
    data: {
      tenantId: laundry.id,
      name: 'Kost Putri Melati',
      phone: '081234567104',
      address: 'Jl. Melati No. 10, Caruban',
      metadata: {
        type: 'corporate',
        pickupSchedule: 'Senin & Kamis',
        defaultService: 'Cuci Setrika Reguler',
        notes: 'Biasanya 15-20kg per minggu',
      },
    },
  });

  console.log(`✅ Laundry: ${laundry.slug} - 7 products, 1 customer`);

  // ==========================================
  // TENANT 5: CATERING
  // ==========================================
  console.log('🍱 Creating Tenant 5: Catering Cabo Resto...');

  const catering = await prisma.tenant.create({
    data: {
      slug: 'caboresto',
      name: 'Cabo Resto Catering',
      category: 'CATERING',
      description:
        'Catering nasi box & prasmanan untuk acara kantor, arisan, dan hajatan. Rasa dijamin enak!',
      whatsapp: '6281234567005',
      email: 'caboresto@fibidy.com',
      phone: '081234567005',
      address: 'Jl. Gatot Subroto No. 50, Caruban',
      password: hashedPassword,
      status: TenantStatus.ACTIVE,
      theme: { primaryColor: '#f59e0b' },
    },
  });

  // Products (Menu) - Catering
  await prisma.product.createMany({
    data: [
      {
        tenantId: catering.id,
        name: 'Nasi Box Ayam Geprek',
        description: 'Nasi + ayam geprek + lalapan + sambal + kerupuk',
        category: 'Nasi Box',
        sku: 'BOX-001',
        price: 20000,
        unit: 'box',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { minOrder: 10, leadTime: 1 },
      },
      {
        tenantId: catering.id,
        name: 'Nasi Box Ayam Bakar',
        description: 'Nasi + ayam bakar + urap + tempe + kerupuk',
        category: 'Nasi Box',
        sku: 'BOX-002',
        price: 25000,
        unit: 'box',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { minOrder: 10, leadTime: 1 },
      },
      {
        tenantId: catering.id,
        name: 'Nasi Box Rendang',
        description: 'Nasi + rendang sapi + sayur nangka + telur balado',
        category: 'Nasi Box',
        sku: 'BOX-003',
        price: 30000,
        unit: 'box',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { minOrder: 15, leadTime: 1 },
      },
      {
        tenantId: catering.id,
        name: 'Nasi Box Ikan Gurame',
        description: 'Nasi + gurame goreng + sayur asem + lalapan',
        category: 'Nasi Box',
        sku: 'BOX-004',
        price: 35000,
        unit: 'box',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { minOrder: 15, leadTime: 1 },
      },
      {
        tenantId: catering.id,
        name: 'Paket Prasmanan A (per 50 pax)',
        description:
          '4 menu: Nasi putih, Ayam goreng, Sayur lodeh, Tempe orek, Sambal, Kerupuk',
        category: 'Prasmanan',
        sku: 'PRS-001',
        price: 1500000,
        unit: 'paket',
        isActive: true,
        isFeatured: true,
        trackStock: false,
        images: [],
        metadata: { minPax: 50, maxPax: 50, leadTime: 3 },
      },
      {
        tenantId: catering.id,
        name: 'Paket Prasmanan B (per 50 pax)',
        description:
          '5 menu: Nasi, Rendang, Ayam bakar, Sayur nangka, Urap, Sambal, Kerupuk',
        category: 'Prasmanan',
        sku: 'PRS-002',
        price: 2000000,
        unit: 'paket',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { minPax: 50, maxPax: 50, leadTime: 3 },
      },
      {
        tenantId: catering.id,
        name: 'Snack Box Meeting',
        description: 'Roti + gorengan + kue + air mineral',
        category: 'Snack',
        sku: 'SNK-001',
        price: 15000,
        unit: 'box',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { minOrder: 20, leadTime: 1 },
      },
      {
        tenantId: catering.id,
        name: 'Tumpeng Mini',
        description: 'Tumpeng kecil untuk 10-15 orang',
        category: 'Tumpeng',
        sku: 'TMP-001',
        price: 350000,
        unit: 'porsi',
        isActive: true,
        trackStock: false,
        images: [],
        metadata: { servings: '10-15', leadTime: 2 },
      },
    ],
  });

  // Customer - Catering
  const customerCatering = await prisma.customer.create({
    data: {
      tenantId: catering.id,
      name: 'PT Maju Bersama',
      phone: '081234567105',
      email: 'hrd@majubersama.co.id',
      address: 'Jl. Industri No. 100, Caruban',
      metadata: {
        type: 'corporate',
        pic: 'Ibu Ratna (HRD)',
        preferredMenu: 'Nasi Box Ayam Bakar',
        paymentTerms: 'Transfer H+7',
        notes: 'Meeting rutin setiap Jumat, biasanya 30-50 box',
      },
    },
  });

  console.log(`✅ Catering: ${catering.slug} - 8 products, 1 customer`);

  // ==========================================
  // CREATE SAMPLE ORDERS
  // ==========================================
  console.log('\n📋 Creating sample orders...');

  const today = new Date();

  // Order untuk Warung
  const warungProducts = await prisma.product.findMany({
    where: { tenantId: warung.id },
    take: 3,
  });

  if (warungProducts.length > 0) {
    const orderWarung = await prisma.order.create({
      data: {
        tenantId: warung.id,
        customerId: customerWarung.id,
        orderNumber: generateOrderNumber(today, 1),
        subtotal: 45500,
        discount: 0,
        tax: 0,
        total: 45500,
        paymentMethod: 'debt',
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.COMPLETED,
        notes: 'Hutang, bayar minggu depan',
        items: {
          create: [
            {
              productId: warungProducts[0]?.id,
              name: warungProducts[0]?.name || 'Indomie Goreng',
              price: 3500,
              qty: 5,
              subtotal: 17500,
            },
            {
              productId: warungProducts[1]?.id,
              name: warungProducts[1]?.name || 'Minyak Goreng',
              price: 28000,
              qty: 1,
              subtotal: 28000,
            },
          ],
        },
      },
    });
    console.log(`  ✅ Order ${orderWarung.orderNumber} (Warung)`);
  }

  // Order untuk Laundry
  const laundryProducts = await prisma.product.findMany({
    where: { tenantId: laundry.id },
    take: 1,
  });

  if (laundryProducts.length > 0) {
    const orderLaundry = await prisma.order.create({
      data: {
        tenantId: laundry.id,
        customerId: customerLaundry.id,
        orderNumber: generateOrderNumber(today, 2),
        subtotal: 105000,
        discount: 0,
        tax: 0,
        total: 105000,
        paymentMethod: 'cash',
        paymentStatus: PaymentStatus.PAID,
        paidAmount: 105000,
        status: OrderStatus.PROCESSING,
        metadata: {
          weight: 15,
          pickupDate: today.toISOString(),
          estimatedDone: new Date(
            today.getTime() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: 'washing',
        },
        items: {
          create: [
            {
              productId: laundryProducts[0]?.id,
              name: 'Cuci Setrika Reguler',
              price: 7000,
              qty: 15,
              subtotal: 105000,
              notes: '15 kg',
            },
          ],
        },
      },
    });
    console.log(`  ✅ Order ${orderLaundry.orderNumber} (Laundry)`);
  }

  // Order untuk Catering
  const cateringProducts = await prisma.product.findMany({
    where: { tenantId: catering.id, sku: 'BOX-002' },
    take: 1,
  });

  if (cateringProducts.length > 0) {
    const deliveryDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const orderCatering = await prisma.order.create({
      data: {
        tenantId: catering.id,
        customerId: customerCatering.id,
        orderNumber: generateOrderNumber(today, 3),
        subtotal: 1250000,
        discount: 50000,
        tax: 0,
        total: 1200000,
        paymentMethod: 'transfer',
        paymentStatus: PaymentStatus.PAID,
        paidAmount: 1200000,
        status: OrderStatus.PENDING,
        notes: 'Kirim ke ruang meeting lt. 3',
        metadata: {
          deliveryDate: deliveryDate.toISOString(),
          deliveryTime: '11:30',
          deliveryAddress: 'Jl. Industri No. 100, Gedung A Lt. 3',
          contactPerson: 'Ibu Ratna',
          contactPhone: '081234567105',
        },
        items: {
          create: [
            {
              productId: cateringProducts[0]?.id,
              name: 'Nasi Box Ayam Bakar',
              price: 25000,
              qty: 50,
              subtotal: 1250000,
              notes: 'Sambal pisah',
            },
          ],
        },
      },
    });
    console.log(`  ✅ Order ${orderCatering.orderNumber} (Catering)`);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETED!');
  console.log('='.repeat(50));
  console.log('\n📋 SUMMARY:\n');

  const tenants = [
    {
      slug: 'tokosari',
      email: 'tokosari@fibidy.com',
      category: 'Warung Kelontong',
    },
    {
      slug: 'bengkeljaya',
      email: 'bengkeljaya@fibidy.com',
      category: 'Bengkel Motor',
    },
    { slug: 'saloncantik', email: 'saloncantik@fibidy.com', category: 'Salon' },
    {
      slug: 'laundrykilat',
      email: 'laundrykilat@fibidy.com',
      category: 'Laundry',
    },
    { slug: 'caboresto', email: 'caboresto@fibidy.com', category: 'Catering' },
  ];

  console.log('🏪 DEMO TENANTS:');
  console.log(
    '┌─────────────────┬──────────────────────────┬──────────────────┐',
  );
  console.log(
    '│ Subdomain       │ Email                    │ Kategori         │',
  );
  console.log(
    '├─────────────────┼──────────────────────────┼──────────────────┤',
  );
  tenants.forEach((t) => {
    console.log(
      `│ ${t.slug.padEnd(15)} │ ${t.email.padEnd(24)} │ ${t.category.padEnd(16)} │`,
    );
  });
  console.log(
    '└─────────────────┴──────────────────────────┴──────────────────┘',
  );
  console.log('\n🔑 Password untuk semua: password123');
  console.log('\n🌐 Access URLs (setelah deployment):');
  tenants.forEach((t) => {
    console.log(`   • ${t.slug}.fibidy.com`);
  });
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
