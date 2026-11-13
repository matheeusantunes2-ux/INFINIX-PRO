import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, HealthModule, AuthModule, CompanyModule, ClientsModule],
})
export class AppModule {}
