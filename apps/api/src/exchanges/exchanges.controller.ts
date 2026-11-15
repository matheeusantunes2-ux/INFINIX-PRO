import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard'; import { RolesGuard } from '../auth/roles.guard'; import { Roles } from '../auth/roles.decorator'; import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { ExchangesService } from './exchanges.service'; import { CreateExchangeDto } from './dto/create-exchange.dto';
@Controller('exchanges') @UseGuards(AuthGuard,RolesGuard)
export class ExchangesController {
 constructor(private readonly exchanges:ExchangesService){}
 @Get() list(@AuthUser() u:CurrentUser,@Query('page') p?:string,@Query('limit') l?:string){return this.exchanges.list(u,Number(p)||1,Number(l)||30);}
 @Get(':id') get(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.exchanges.get(u,id);}
 @Post() @Roles('OWNER','ADMIN','MANAGER') create(@AuthUser() u:CurrentUser,@Body() b:CreateExchangeDto){return this.exchanges.create(u,b);}
}