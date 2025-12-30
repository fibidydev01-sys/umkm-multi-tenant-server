import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule, // ← Add AuthModule
    // TenantsModule,   (Step 2 Part 2)
    // ProductsModule,  (Step 2 Part 3)
    // CustomersModule, (Step 2 Part 4)
    // OrdersModule,    (Step 2 Part 4)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
