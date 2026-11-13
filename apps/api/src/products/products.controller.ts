import {Body,Controller,Get,Param,Patch,Post,Query,UseGuards} from '@nestjs/common';
import {AuthGuard} from '../auth/auth.guard'; import {RolesGuard} from '../auth/roles.guard'; import {Roles} from '../auth/roles.decorator'; import {AuthUser,CurrentUser} from '../auth/current-user.decorator';
import {ProductsService} from './products.service'; import {CreateProductDto} from './dto/create-product.dto'; import {UpdateProductDto} from './dto/update-product.dto'; import {StockAdjustmentDto} from './dto/stock-adjustment.dto';
@Controller('products') @UseGuards(AuthGuard,RolesGuard)
export class ProductsController {
 constructor(private readonly products:ProductsService){}
 @Get() list(@AuthUser() u:CurrentUser,@Query('q') q?:string,@Query('page') p?:string,@Query('limit') l?:string,@Query('lowStock') low?:string){return this.products.list(u,q,Number(p)||1,Number(l)||30,low);}
 @Post() @Roles('OWNER','ADMIN','MANAGER') create(@AuthUser() u:CurrentUser,@Body() b:CreateProductDto){return this.products.create(u,b);}
 @Get(':id') get(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.products.get(u,id);}
 @Patch(':id') @Roles('OWNER','ADMIN','MANAGER') update(@AuthUser() u:CurrentUser,@Param('id') id:string,@Body() b:UpdateProductDto){return this.products.update(u,id,b);}
 @Post(':id/stock') @Roles('OWNER','ADMIN','MANAGER') adjust(@AuthUser() u:CurrentUser,@Param('id') id:string,@Body() b:StockAdjustmentDto){return this.products.adjustStock(u,id,b);}
 @Patch(':id/archive') @Roles('OWNER','ADMIN') archive(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.products.archive(u,id);}
}