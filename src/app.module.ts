import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, // ← Add PrismaModule
    // AuthModule,      (Step 2)
    // TenantsModule,   (Step 2)
    // ProductsModule,  (Step 2)
    // CustomersModule, (Step 2)
    // OrdersModule,    (Step 2)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }