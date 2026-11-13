import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
@Controller('notifications') @UseGuards(AuthGuard,RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications:NotificationsService){}
  @Get() list(@AuthUser() u:CurrentUser,@Query('page') p?:string,@Query('limit') l?:string){return this.notifications.list(u,Number(p)||1,Number(l)||30);}
  @Patch('read-all') readAll(@AuthUser() u:CurrentUser){return this.notifications.markAllRead(u);}
  @Patch(':id/read') read(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.notifications.markRead(u,id);}
}