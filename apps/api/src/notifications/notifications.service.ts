import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma:PrismaService){}
  private async membership(user:CurrentUser){
    const m=await this.prisma.membership.findFirst({where:{companyId:user.companyId,userId:user.sub,active:true},select:{id:true}});
    if(!m) throw new NotFoundException('Vínculo empresarial não encontrado.');
    return m.id;
  }
  async list(user:CurrentUser,page=1,limit=30){
    const membershipId=await this.membership(user),p=Math.max(1,Number(page)||1),l=Math.min(100,Math.max(1,Number(limit)||30));
    const where={companyId:user.companyId,membershipId};
    const [items,total,unread]=await this.prisma.$transaction([
      this.prisma.notification.findMany({where,orderBy:{createdAt:'desc'},skip:(p-1)*l,take:l}),
      this.prisma.notification.count({where}),
      this.prisma.notification.count({where:{...where,readAt:null}})]);
    return {items,unread,pagination:{page:p,limit:l,total,pages:Math.ceil(total/l)}};
  }
  async markRead(user:CurrentUser,id:string){
    const membershipId=await this.membership(user);
    const result=await this.prisma.notification.updateMany({where:{id,companyId:user.companyId,membershipId,readAt:null},data:{readAt:new Date()}});
    if(!result.count) {
      const exists=await this.prisma.notification.findFirst({where:{id,companyId:user.companyId,membershipId},select:{id:true}});
      if(!exists) throw new NotFoundException('Notificação não encontrada.');
    }
    return {success:true};
  }
  async markAllRead(user:CurrentUser){
    const membershipId=await this.membership(user);
    const result=await this.prisma.notification.updateMany({where:{companyId:user.companyId,membershipId,readAt:null},data:{readAt:new Date()}});
    return {success:true,updated:result.count};
  }
}