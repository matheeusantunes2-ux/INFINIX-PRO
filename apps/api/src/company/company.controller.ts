import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { CompanyService } from './company.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ModulePermissionDto } from './dto/module-permission.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}
  @Get('current')
  current(@AuthUser() user: CurrentUser) { return this.companies.current(user); }
  @Get('members')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  members(@AuthUser() user: CurrentUser) { return this.companies.members(user); }
  @Post('invitations')
  @Roles('OWNER', 'ADMIN')
  invite(@AuthUser() user: CurrentUser, @Body() body: InviteMemberDto) {
    return this.companies.invite(user, body);
  }
  @Patch('members/:id/role')
  @Roles('OWNER')
  updateRole(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.companies.updateRole(user, id, body);
  }
  @Patch('members/:id/block')
  @Roles('OWNER', 'ADMIN')
  block(@AuthUser() user: CurrentUser, @Param('id') id: string) {
    return this.companies.setMemberActive(user, id, false);
  }
  @Patch('members/:id/reactivate')
  @Roles('OWNER', 'ADMIN')
  reactivate(@AuthUser() user: CurrentUser, @Param('id') id: string) {
    return this.companies.setMemberActive(user, id, true);
  }
  @Put('members/:id/permissions')
  @Roles('OWNER', 'ADMIN')
  setPermission(@AuthUser() user: CurrentUser, @Param('id') id: string, @Body() body: ModulePermissionDto) {
    return this.companies.setPermission(user, id, body);
  }
}
