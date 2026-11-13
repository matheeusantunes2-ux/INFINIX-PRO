import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';

@Controller('proposals')
@UseGuards(AuthGuard, RolesGuard)
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Get()
  list(@AuthUser() user: CurrentUser, @Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.proposals.list(user, Number(page) || 1, Number(limit) || 20, status);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  create(@AuthUser() user: CurrentUser, @Body() body: CreateProposalDto) {
    return this.proposals.create(user, body);
  }

  @Get(':id')
  get(@AuthUser() user: CurrentUser, @Param('id') id: string) {
    return this.proposals.get(user, id);
  }

  @Patch(':id')
  update(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateProposalDto) {
    return this.proposals.update(user, id, body);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  changeStatus(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateProposalStatusDto) {
    return this.proposals.changeStatus(user, id, body);
  }
}