import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}
  private async membership(user: CurrentUser) {
    const m = await this.prisma.membership.findFirst({ where: { companyId: user.companyId, userId: user.sub, active: true }, select: { id: true } });
    if (!m) throw new ForbiddenException('Vínculo empresarial inativo.');
    return m.id;
  }
  async list(user: CurrentUser, page = 1, limit = 20) {
    const p = Math.max(1, Number(page) || 1), l = Math.min(50, Math.max(1, Number(limit) || 20));
    const where = { companyId: user.companyId };
    const [items,total] = await this.prisma.$transaction([
      this.prisma.feedPost.findMany({ where, orderBy: [{ announcement: 'desc' }, { createdAt: 'desc' }], skip:(p-1)*l, take:l,
        include:{ author:{select:{id:true,name:true}}, _count:{select:{comments:true,reactions:true}},
          comments:{orderBy:{createdAt:'asc'},take:3,include:{membership:{include:{user:{select:{id:true,name:true}}}}}} } }),
      this.prisma.feedPost.count({where}),
    ]);
    return {items,pagination:{page:p,limit:l,total,pages:Math.ceil(total/l)}};
  }
  async create(user: CurrentUser, dto: CreatePostDto) {
    const announcement = !!dto.announcement;
    if (announcement && !['OWNER','ADMIN','MANAGER'].includes(user.role)) throw new ForbiddenException('Somente gestão pode publicar comunicados oficiais.');
    const post = await this.prisma.feedPost.create({ data:{companyId:user.companyId,authorId:user.sub,content:dto.content.trim(),mediaUrl:dto.mediaUrl,announcement},
      include:{author:{select:{id:true,name:true}},_count:{select:{comments:true,reactions:true}}} });
    await this.prisma.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:announcement?'OFFICIAL_ANNOUNCEMENT_CREATED':'FEED_POST_CREATED',entity:'FeedPost',entityId:post.id}});
    if (announcement) {
      const recipients = await this.prisma.membership.findMany({where:{companyId:user.companyId,active:true,userId:{not:user.sub}},select:{id:true}});
      if (recipients.length) await this.prisma.notification.createMany({data:recipients.map(m=>({companyId:user.companyId,membershipId:m.id,type:'ANNOUNCEMENT',title:'Comunicado oficial',body:dto.content.trim().slice(0,180),resourceType:'FeedPost',resourceId:post.id}))});
    }
    return post;
  }
  async comment(user: CurrentUser, postId: string, dto: CreateCommentDto) {
    const membershipId = await this.membership(user);
    const post = await this.prisma.feedPost.findFirst({where:{id:postId,companyId:user.companyId},select:{id:true}});
    if(!post) throw new NotFoundException('Publicação não encontrada.');
    return this.prisma.feedComment.create({data:{postId,membershipId,body:dto.body.trim()},include:{membership:{include:{user:{select:{id:true,name:true}}}}}});
  }
  async react(user: CurrentUser, postId: string) {
    const membershipId = await this.membership(user);
    const post = await this.prisma.feedPost.findFirst({where:{id:postId,companyId:user.companyId},select:{id:true}});
    if(!post) throw new NotFoundException('Publicação não encontrada.');
    const existing = await this.prisma.feedReaction.findUnique({where:{postId_membershipId:{postId,membershipId}}});
    if(existing) { await this.prisma.feedReaction.delete({where:{id:existing.id}}); return {reacted:false}; }
    await this.prisma.feedReaction.create({data:{postId,membershipId}});
    return {reacted:true};
  }
  async remove(user: CurrentUser, postId: string) {
    const post = await this.prisma.feedPost.findFirst({where:{id:postId,companyId:user.companyId},select:{id:true,authorId:true}});
    if(!post) throw new NotFoundException('Publicação não encontrada.');
    if(post.authorId!==user.sub && !['OWNER','ADMIN'].includes(user.role)) throw new ForbiddenException('Sem permissão para remover esta publicação.');
    await this.prisma.feedPost.delete({where:{id:postId}});
    await this.prisma.auditLog.create({data:{companyId:user.companyId,userId:user.sub,action:'FEED_POST_DELETED',entity:'FeedPost',entityId:postId}});
    return {success:true};
  }
}