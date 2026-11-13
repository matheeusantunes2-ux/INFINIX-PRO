import {BadRequestException,Injectable,NotFoundException} from '@nestjs/common'; import {Prisma} from '@prisma/client'; import {PrismaService} from '../prisma/prisma.service'; import {CurrentUser} from '../auth/current-user.decorator'; import {CreateOrderDto} from './dto/create-order.dto'; import {CheckoutOrderDto} from './dto/checkout-order.dto';
@Injectable()
export class OrdersService {
 constructor(private readonly prisma:PrismaService){}
 async list(user:CurrentUser,page=1,limit=20,status?:string) {
  const p=Math.max(1,Number(page)||1),take=Math.min(100,Math.max(1,Number(limit)||20));
  const allowed=['OPEN','IN_PROGRESS','CLOSED','CANCELLED']; if(status&&!allowed.includes(status)) throw new BadRequestException('Status de comanda inválido.');
  const where={companyId:user.companyId,...(status?{status:status as any}:{})};
  const [items,total]=await this.prisma.$transaction([this.prisma.order.findMany({where,include:{client:{select:{id:true,name:true}},sellerMembership:{include:{user:{select:{id:true,name:true}}}},unit:{select:{id:true,name:true}},items:{include:{product:{select:{id:true,name:true,sku:true}}}}},orderBy:{openedAt:'desc'},skip:(p-1)*take,take}),this.prisma.order.count({where})]);
  return {items,pagination:{page:p,limit:take,total,pages:Math.ceil(total/take)}};
 }
 async create(user:CurrentUser,dto:CreateOrderDto) {
  if(dto.items.some(i=>!Number.isFinite(i.quantity)||i.quantity<=0||!Number.isFinite(Number(i.quantity.toFixed(3))))) throw new BadRequestException('Quantidade inválida.');
  return this.prisma.$transaction(async tx=>{
   if(dto.clientId && !await tx.client.findFirst({where:{id:dto.clientId,companyId:user.companyId,active:true},select:{id:true}})) throw new NotFoundException('Cliente não encontrado nesta empresa.');
   const ids=[...new Set(dto.items.map(i=>i.productId))];
   const products=await tx.product.findMany({where:{id:{in:ids},companyId:user.companyId,active:true}});
   if(products.length!==ids.length) throw new NotFoundException('Um ou mais produtos não existem ou estão inativos nesta empresa.');
   const lines=dto.items.map(i=>{const product=products.find(p=>p.id===i.productId)!; const qty=new Prisma.Decimal(i.quantity); return {productId:i.productId,quantity:qty,unitPrice:product.price,total:product.price.mul(qty)};});
   const total=lines.reduce((sum,line)=>sum.plus(line.total),new Prisma.Decimal(0));
   const seller=await tx.membership.findFirst({where:{companyId:user.companyId,userId:user.sub,active:true},select:{id:true,unitId:true}});
   if(!seller) throw new NotFoundException('Vínculo ativo do funcionário não encontrado.');
   const order=await tx.order.create({data:{companyId:user.companyId,clientId:dto.clientId||null,sellerMembershipId:seller.id,unitId:seller.unitId,notes:dto.notes?.trim()||null,total,items:{create:lines}},include:{items:{include:{product:true}},client:true,sellerMembership:{include:{user:{select:{id:true,name:true}}}},unit:true}});
   await tx.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'ORDER_CREATED',entity:'Order',entityId:order.id}});
   return order;
  });
 }
 async get(user:CurrentUser,id:string) {
  const order=await this.prisma.order.findFirst({where:{id,companyId:user.companyId},include:{client:true,sellerMembership:{include:{user:{select:{id:true,name:true}}}},unit:true,items:{include:{product:true}},financialEntry:true,stockMovements:true}});
  if(!order) throw new NotFoundException('Comanda não encontrada.'); return order;
 }
 async checkout(user:CurrentUser,id:string,dto:CheckoutOrderDto) {
  return this.prisma.$transaction(async tx=>{
   const order=await tx.order.findFirst({where:{id,companyId:user.companyId},include:{items:true}});
   if(!order) throw new NotFoundException('Comanda não encontrada.');
   if(order.status!=='OPEN'&&order.status!=='IN_PROGRESS') throw new BadRequestException('Esta comanda não pode ser finalizada.');
   if(order.items.length===0) throw new BadRequestException('Comanda sem itens.');
   for(const item of order.items) {
    const stock=await tx.product.updateMany({where:{id:item.productId,companyId:user.companyId,active:true,stock:{gte:item.quantity}},data:{stock:{decrement:item.quantity}}});
    if(!stock.count) throw new BadRequestException('Estoque insuficiente ou produto indisponível: '+item.productId);
    await tx.stockMovement.create({data:{companyId:user.companyId,productId:item.productId,orderId:order.id,type:'OUT',quantity:item.quantity,reason:'Venda/comanda finalizada'}});
   }
   const now=new Date();
   const closed=await tx.order.updateMany({where:{id,companyId:user.companyId,status:{in:['OPEN','IN_PROGRESS']}},data:{status:'CLOSED',closedAt:now,paymentMethod:dto.paymentMethod}});
   if(!closed.count) throw new BadRequestException('A comanda já foi alterada por outra operação.');
   const entry=await tx.financialEntry.create({data:{companyId:user.companyId,type:'INCOME',status:'PAID',description:'Venda - comanda '+order.id,amount:order.total,dueAt:now,paidAt:now,category:'Vendas',paymentMethod:dto.paymentMethod,reference:dto.reference||order.id,orderId:order.id}});
   await tx.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'ORDER_CHECKED_OUT',entity:'Order',entityId:id,metadata:{total:order.total.toString(),paymentMethod:dto.paymentMethod}}});
   return {order:await tx.order.findFirstOrThrow({where:{id,companyId:user.companyId},include:{items:{include:{product:true}},client:true,sellerMembership:{include:{user:{select:{id:true,name:true}}}},unit:true}}),financialEntry:entry};
  });
 }
 async cancel(user:CurrentUser,id:string) {
  const result=await this.prisma.order.updateMany({where:{id,companyId:user.companyId,status:{in:['OPEN','IN_PROGRESS']}},data:{status:'CANCELLED'}});
  if(!result.count){const found=await this.prisma.order.findFirst({where:{id,companyId:user.companyId},select:{id:true}});if(!found)throw new NotFoundException('Comanda não encontrada.');throw new BadRequestException('Somente comandas abertas podem ser canceladas.');}
  await this.prisma.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'ORDER_CANCELLED',entity:'Order',entityId:id}});
  return this.get(user,id);
 }
}