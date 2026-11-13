import {Body,Controller,Get,Param,Patch,Post,Query,UseGuards} from '@nestjs/common'; import {AuthGuard} from '../auth/auth.guard'; import {RolesGuard} from '../auth/roles.guard'; import {Roles} from '../auth/roles.decorator'; import {AuthUser,CurrentUser} from '../auth/current-user.decorator'; import {OrdersService} from './orders.service'; import {CreateOrderDto} from './dto/create-order.dto'; import {CheckoutOrderDto} from './dto/checkout-order.dto';
@Controller('orders') @UseGuards(AuthGuard,RolesGuard)
export class OrdersController {
 constructor(private readonly orders:OrdersService){}
 @Get() list(@AuthUser() u:CurrentUser,@Query('page') p?:string,@Query('limit') l?:string,@Query('status') s?:string){return this.orders.list(u,Number(p)||1,Number(l)||20,s);}
 @Post() @Roles('OWNER','ADMIN','MANAGER','MEMBER') create(@AuthUser() u:CurrentUser,@Body() b:CreateOrderDto){return this.orders.create(u,b);}
 @Get(':id') get(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.orders.get(u,id);}
 @Post(':id/checkout') @Roles('OWNER','ADMIN','MANAGER') checkout(@AuthUser() u:CurrentUser,@Param('id') id:string,@Body() b:CheckoutOrderDto){return this.orders.checkout(u,id,b);}
 @Post(':id/cancel') @Roles('OWNER','ADMIN','MANAGER') cancel(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.orders.cancel(u,id);}
}