import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@AuthUser() user: CurrentUser, @Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.clients.list(user, q, Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  create(@AuthUser() user: CurrentUser, @Body() body: CreateClientDto) {
    return this.clients.create(user, body);
  }

  @Get(':id')
  get(@AuthUser() user: CurrentUser, @Param('id') id: string) {
    return this.clients.get(user, id);
  }

  @Patch(':id')
  update(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateClientDto) {
    return this.clients.update(user, id, body);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  archive(@AuthUser() user: CurrentUser, @Param('id') id: string) {
    return this.clients.archive(user, id);
  }
}