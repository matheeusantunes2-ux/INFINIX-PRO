import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateExchangeDto } from './dto/create-exchange.dto';
@Injectable()
export class ExchangesService {
 constructor(private readonly prisma: PrismaService) {}
 async list(user: CurrentUser, page=1, limit=30) {
  const p=Math.max(1,Number(page)||1), take=Math.min(100,Math.max(1,Number(limit)||30));
  const where={companyId:user.companyId};
  const [items,total]=await this.prisma.$transaction([
   this.prisma.exchange.findMany({where,include:{order:{select:{id:true,closedAt:true,total:true}},items:{include:{returnedProduct:true,replacementProduct:true}}},orderBy:{createdAt:'desc'},skip:(p-1)*take,take}),
   this.prisma.exchange.count({where})
  ]);
  return {items,pagination:{page:p,limit:take,total,pages:Math.ceil(total/take)}};
 }
 async create(user:CurrentUser,dto:CreateExchangeDto) {
  return this.prisma.$transaction(async tx=>{
   const order=await tx.order.findFirst({where:{id:dto.orderId,companyId:user.companyId,status:'CLOSED'},include:{items:true}});
   if(!order) throw new NotFoundException('Venda finalizada não encontrada nesta empresa.');
   if(dto.settlement==='REFUND') throw new BadRequestException('Estorno financeiro automático não está disponível. Utilize crédito na loja ou registre o reembolso no meio de pagamento original.');
   const seen=new Set<string>(); let returnedValue=new Prisma.Decimal(0), replacementValue=new Prisma.Decimal(0);
   const lines:any[]=[];
   for(const line of dto.items) {
    if(seen.has(line.orderItemId)) throw new BadRequestException('Item repetido na mesma troca.'); seen.add(line.orderItemId);
    const sold=order.items.find(i=>i.id===line.orderItemId);
    if(!sold) throw new NotFoundException('Item não pertence à venda informada.');
    const prior=await tx.exchangeItem.aggregate({where:{orderItemId:sold.id,exchange:{status:'COMPLETED'}},_sum:{returnedQuantity:true}});
    const already=prior._sum.returnedQuantity||new Prisma.Decimal(0);
    const remaining=sold.quantity.minus(already), qty=new Prisma.Decimal(line.returnedQuantity);
    if(qty.lte(0)||qty.gt(remaining)) throw new BadRequestException('Quantidade de troca maior que o saldo ainda não trocado do item.');
    const value=sold.unitPrice.mul(qty); returnedValue=returnedValue.plus(value);
    let replacement:any=null, replacementQty=new Prisma.Decimal(0), replacementUnit:Prisma.Decimal|null=null;
    if(line.replacementProductId) {
     if(!line.replacementQuantity||line.replacementQuantity<=0) throw new BadRequestException('Informe a quantidade do produto substituto.');
     replacement=await tx.product.findFirst({where:{id:line.replacementProductId,companyId:user.companyId,active:true}});
     if(!replacement) throw new NotFoundException('Produto substituto não encontrado nesta empresa.');
     replacementQty=new Prisma.Decimal(line.replacementQuantity); replacementUnit=replacement.price;
     replacementValue=replacementValue.plus(replacement.price.mul(replacementQty));
    } else if(line.replacementQuantity) throw new BadRequestException('Selecione o produto substituto.');
    lines.push({orderItemId:sold.id,returnedProductId:sold.productId,replacementProductId:replacement?.id||null,returnedQuantity:qty,replacementQuantity:replacementQty,returnedUnitValue:sold.unitPrice,replacementUnitValue:replacementUnit,condition:line.condition,replacement});
   }
   const difference=replacementValue.minus(returnedValue);
   if(difference.gt(0)&&!dto.paymentMethod) throw new BadRequestException('A troca exige pagamento da diferença. Informe a forma de pagamento.');
   if(difference.lt(0)&&dto.settlement!=='STORE_CREDIT') throw new BadRequestException('A diferença a favor do cliente deve ser registrada como crédito na loja.');
   const exchange=await tx.exchange.create({data:{companyId:user.companyId,orderId:order.id,performedBy:user.sub,reason:dto.reason,returnedValue,replacementValue,difference,settlement:'STORE_CREDIT',paymentMethod:difference.gt(0)?dto.paymentMethod:null,notes:dto.notes||null,items:{create:lines.map(({replacement,...data})=>data)}},include:{items:true}});
   for(const line of lines) {
    if(line.condition==='SELLABLE') {
     await tx.product.update({where:{id:line.returnedProductId},data:{stock:{increment:line.returnedQuantity}}});
     await tx.stockMovement.create({data:{companyId:user.companyId,productId:line.returnedProductId,type:'IN',quantity:line.returnedQuantity,reason:'Troca '+exchange.id+' - produto em condição de revenda'}});
    }
    if(line.replacement) {
     const updated=await tx.product.updateMany({where:{id:line.replacement.id,companyId:user.companyId,active:true,stock:{gte:line.replacementQuantity}},data:{stock:{decrement:line.replacementQuantity}}});
     if(!updated.count) throw new BadRequestException('Estoque insuficiente para o produto substituto: '+line.replacement.name);
     await tx.stockMovement.create({data:{companyId:user.companyId,productId:line.replacement.id,type:'OUT',quantity:line.replacementQuantity,reason:'Troca '+exchange.id+' - produto substituto'}});
    }
   }
   if(difference.gt(0)) await tx.financialEntry.create({data:{companyId:user.companyId,type:'INCOME',status:'PAID',description:'Diferença recebida na troca '+exchange.id,amount:difference,dueAt:new Date(),paidAt:new Date(),category:'Trocas',paymentMethod:dto.paymentMethod,reference:exchange.id}});
   await tx.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'EXCHANGE_COMPLETED',entity:'Exchange',entityId:exchange.id,metadata:{orderId:order.id,returnedValue:returnedValue.toString(),replacementValue:replacementValue.toString(),difference:difference.toString()}}});
   return tx.exchange.findFirstOrThrow({where:{id:exchange.id,companyId:user.companyId},include:{order:true,items:{include:{returnedProduct:true,replacementProduct:true}}}});
  });
 }
 async get(user:CurrentUser,id:string) {
  const exchange=await this.prisma.exchange.findFirst({where:{id,companyId:user.companyId},include:{order:true,items:{include:{returnedProduct:true,replacementProduct:true}}}});
  if(!exchange) throw new NotFoundException('Troca não encontrada.'); return exchange;
 }
}