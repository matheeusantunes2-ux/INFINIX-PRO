import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('sales')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  sales(@AuthUser() user: CurrentUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboard.sales(user, from, to);
  }
}
