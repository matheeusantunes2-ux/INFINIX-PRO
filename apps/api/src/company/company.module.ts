import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({ controllers: [CompanyController], providers: [CompanyService, AuthGuard, RolesGuard] })
export class CompanyModule {}
