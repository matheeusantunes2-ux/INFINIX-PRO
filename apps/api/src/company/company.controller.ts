import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { CompanyService } from './company.service';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}
  @Get('current')
  current(@AuthUser() user: CurrentUser) { return this.companies.current(user); }
  @Get('members')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  members(@AuthUser() user: CurrentUser) { return this.companies.members(user); }
}
