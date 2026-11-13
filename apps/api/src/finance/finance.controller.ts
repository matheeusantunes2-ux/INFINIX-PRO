import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { FinanceService } from './finance.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { PayEntryDto } from './dto/pay-entry.dto';

@Controller('finance')
@UseGuards(AuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('summary')
  summary(@AuthUser() user: CurrentUser, @Query('month') month?: string) { return this.finance.summary(user, month); }

  @Get('entries')
  list(@AuthUser() user: CurrentUser, @Query('page') page?: string, @Query('limit') limit?: string, @Query('type') type?: string, @Query('status') status?: string, @Query('category') category?: string, @Query('from') from?: string, @Query('to') to?: string, @Query('overdue') overdue?: string) {
    return this.finance.list(user, Number(page) || 1, Number(limit) || 20, type, status, category, from, to, overdue);
  }

  @Post('entries')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  create(@AuthUser() user: CurrentUser, @Body() body: CreateEntryDto) { return this.finance.create(user, body); }

  @Get('entries/:id')
  get(@AuthUser() user: CurrentUser, @Param('id') id: string) { return this.finance.get(user, id); }

  @Patch('entries/:id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  update(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateEntryDto) { return this.finance.update(user, id, body); }

  @Patch('entries/:id/pay')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  pay(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: PayEntryDto) { return this.finance.pay(user, id, body); }

  @Patch('entries/:id/cancel')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  cancel(@AuthUser() user: CurrentUser, @Param('id') id: string) { return this.finance.cancel(user, id); }
}