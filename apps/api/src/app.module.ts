import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { ClientsModule } from './clients/clients.module';
import { ProposalsModule } from './proposals/proposals.module';
import { CalendarModule } from './calendar/calendar.module';
import { FinanceModule } from './finance/finance.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, HealthModule, AuthModule, CompanyModule, ClientsModule, ProposalsModule, CalendarModule, FinanceModule, ProductsModule, OrdersModule],
})
export class AppModule {}
