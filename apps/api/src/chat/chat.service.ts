import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
@Injectable()
export class ChatService {
  constructor(private readonly prisma:PrismaService){}
  private async membership(user:CurrentUser){
    const m=await this.prisma.membership.findFirst({where:{companyId:user.companyId,userId:user.sub,active:true},select:{id:true}});
    if(!m) throw new ForbiddenException('Vínculo empresarial inativo.');
    return m.id;
  }
  async list(user:CurrentUser){
    const membershipId=await this.membership(user);
    return this.prisma.conversation.findMany({where:{companyId:user.companyId,members:{some:{membershipId}}},orderBy:{createdAt:'desc'},
      include:{members:{include:{membership:{include:{user:{select:{id:true,name:true}}}}}},messages:{orderBy:{createdAt:'desc'},take:1}}});
  }
  async create(user:CurrentUser,dto:CreateConversationDto){
    const myId=await this.membership(user);
    const ids=[...new Set([...dto.memberIds,myId])];
    const members=await this.prisma.membership.findMany({where:{id:{in:ids},companyId:user.companyId,active:true},select:{id:true}});
    if(members.length!==ids.length) throw new NotFoundException('Um ou mais participantes não pertencem à empresa ou estão inativos.');
    return this.prisma.conversation.create({data:{companyId:user.companyId,title:dto.title?.trim()||null,
      members:{create:ids.map(membershipId=>({membershipId}))}},include:{members:{include:{membership:{include:{user:{select:{id:true,name:true}}}}}}}});
  }
  private async assertParticipant(user:CurrentUser,conversationId:string){
    const membershipId=await this.membership(user);
    const conversation=await this.prisma.conversation.findFirst({where:{id:conversationId,companyId:user.companyId,members:{some:{membershipId}}},select:{id:true}});
    if(!conversation) throw new NotFoundException('Conversa não encontrada.');
    return membershipId;
  }
  async messages(user:CurrentUser,conversationId:string,page=1,limit=50){
    await this.assertParticipant(user,conversationId);
    const p=Math.max(1,Number(page)||1),l=Math.min(100,Math.max(1,Number(limit)||50));
    const [items,total]=await this.prisma.$transaction([
      this.prisma.message.findMany({where:{conversationId},orderBy:{createdAt:'desc'},skip:(p-1)*l,take:l,include:{sender:{select:{id:true,name:true}}}}),
      this.prisma.message.count({where:{conversationId}})]);
    return {items:items.reverse(),pagination:{page:p,limit:l,total,pages:Math.ceil(total/l)}};
  }
  async send(user:CurrentUser,conversationId:string,dto:CreateMessageDto){
    const membershipId=await this.assertParticipant(user,conversationId);
    const message=await this.prisma.message.create({data:{conversationId,senderId:user.sub,body:dto.body.trim()},include:{sender:{select:{id:true,name:true}}}});
    const recipients=await this.prisma.conversationMember.findMany({where:{conversationId,membershipId:{not:membershipId},membership:{active:true}},select:{membershipId:true,conversation:{select:{companyId:true}}}});
    if(recipients.length) await this.prisma.notification.createMany({data:recipients.map(r=>({companyId:user.companyId,membershipId:r.membershipId,type:'NEW_MESSAGE',title:'Nova mensagem',body:dto.body.trim().slice(0,180),resourceType:'Conversation',resourceId:conversationId}))});
    return message;
  }
  async markRead(user:CurrentUser,conversationId:string){
    const membershipId=await this.assertParticipant(user,conversationId);
    const unread=await this.prisma.message.findMany({where:{conversationId,senderId:{not:user.sub},reads:{none:{membershipId}}},select:{id:true}});
    if(unread.length) await this.prisma.messageRead.createMany({data:unread.map(m=>({messageId:m.id,membershipId})),skipDuplicates:true});
    return {marked:unread.length};
  }
}
