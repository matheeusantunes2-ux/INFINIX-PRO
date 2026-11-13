import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Controller('calendar')
@UseGuards(AuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('events')
  list(@AuthUser() user: CurrentUser, @Query('from') from?: string, @Query('to') to?: string,
    @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.calendar.list(user, from, to, status, Number(page) || 1, Number(limit) || 50);
  }

  @Post('events')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  create(@AuthUser() user: CurrentUser, @Body() body: CreateEventDto) {
    return this.calendar.create(user, body);
  }

  @Get('events/:id')
  get(@AuthUser() user: CurrentUser, @Param('id') id: string) {
    return this.calendar.get(user, id);
  }

  @Patch('events/:id')
  update(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.calendar.update(user, id, body);
  }

  @Patch('events/:id/status')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  changeStatus(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateEventStatusDto) {
    return this.calendar.changeStatus(user, id, body);
  }
}