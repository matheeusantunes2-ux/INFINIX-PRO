import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class ProductsService {
 constructor(private readonly prisma: PrismaService) {}
 async list(user:CurrentUser,q?:string,page=1,limit=30,lowStock?:string) {
  const p=Math.max(1,Number(page)||1), take=Math.min(100,Math.max(1,Number(limit)||30));
  const where:Prisma.ProductWhereInput={companyId:user.companyId,active:true,...(q?.trim()?{OR:[{name:{contains:q.trim(),mode:'insensitive'}},{sku:{contains:q.trim(),mode:'insensitive'}}]}:{})};
  if(lowStock==='true') {
   const all=await this.prisma.product.findMany({where,orderBy:{name:'asc'}});
   const filtered=all.filter(item=>item.stock.lessThanOrEqualTo(item.minStock));
   const items=filtered.slice((p-1)*take,p*take);
   return {items,pagination:{page:p,limit:take,total:filtered.length,pages:Math.ceil(filtered.length/take)}};
  }
  const [items,total]=await this.prisma.$transaction([this.prisma.product.findMany({where,orderBy:{name:'asc'},skip:(p-1)*take,take}),this.prisma.product.count({where})]);
  return {items,pagination:{page:p,limit:take,total,pages:Math.ceil(total/take)}};
 }
 async create(user:CurrentUser,dto:CreateProductDto) {
  const product=await this.prisma.$transaction(async tx=>{
   const created=await tx.product.create({data:{companyId:user.companyId,name:dto.name.trim(),sku:dto.sku?.trim()||null,price:new Prisma.Decimal(dto.price),stock:new Prisma.Decimal(dto.stock??0),minStock:new Prisma.Decimal(dto.minStock??0)}});
   if((dto.stock??0)>0) await tx.stockMovement.create({data:{companyId:user.companyId,productId:created.id,type:'IN',quantity:new Prisma.Decimal(dto.stock!),reason:'Estoque inicial'}});
   await tx.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'PRODUCT_CREATED',entity:'Product',entityId:created.id}});
   return created;
  }); return product;
 }
 async get(user:CurrentUser,id:string) {
  const product=await this.prisma.product.findFirst({where:{id,companyId:user.companyId,active:true},include:{stockMovements:{orderBy:{createdAt:'desc'},take:20}}});
  if(!product) throw new NotFoundException('Produto não encontrado.'); return product;
 }
 async update(user:CurrentUser,id:string,dto:UpdateProductDto) {
  const result=await this.prisma.product.updateMany({where:{id,companyId:user.companyId,active:true},data:{...(dto.name!==undefined?{name:dto.name.trim()}:{}),...(dto.sku!==undefined?{sku:dto.sku?.trim()||null}:{}),...(dto.price!==undefined?{price:new Prisma.Decimal(dto.price)}:{}),...(dto.minStock!==undefined?{minStock:new Prisma.Decimal(dto.minStock)}:{})}});
  if(!result.count) throw new NotFoundException('Produto não encontrado.');
  await this.prisma.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'PRODUCT_UPDATED',entity:'Product',entityId:id}});
  return this.get(user,id);
 }
 async adjustStock(user:CurrentUser,id:string,dto:StockAdjustmentDto) {
  const qty=new Prisma.Decimal(dto.quantity);
  return this.prisma.$transaction(async tx=>{
   const product=await tx.product.findFirst({where:{id,companyId:user.companyId,active:true},select:{id:true,stock:true}});
   if(!product) throw new NotFoundException('Produto não encontrado.');
   if(dto.direction==='OUT' && product.stock.lessThan(qty)) throw new BadRequestException('Estoque insuficiente.');
   const delta=dto.direction==='IN'?qty:qty.negated();
   const changed=await tx.product.updateMany({where:{id,companyId:user.companyId,active:true,...(dto.direction==='OUT'?{stock:{gte:qty}}:{})},data:{stock:{increment:delta}}});
   if(!changed.count) throw new BadRequestException('Estoque insuficiente ou produto indisponível.');
   const movement=await tx.stockMovement.create({data:{companyId:user.companyId,productId:id,type:dto.direction,quantity:qty,reason:dto.reason?.trim()||null}});
   await tx.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'STOCK_ADJUSTED',entity:'Product',entityId:id,metadata:{direction:dto.direction,quantity:dto.quantity}}});
   return {movement,stock:(await tx.product.findUniqueOrThrow({where:{id}})).stock};
  });
 }
 async archive(user:CurrentUser,id:string) {
  const result=await this.prisma.product.updateMany({where:{id,companyId:user.companyId,active:true},data:{active:false}});
  if(!result.count) throw new NotFoundException('Produto não encontrado.');
  await this.prisma.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'PRODUCT_ARCHIVED',entity:'Product',entityId:id}});
  return {success:true};
 }
}