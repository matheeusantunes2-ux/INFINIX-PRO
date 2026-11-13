import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
@Controller('feed') @UseGuards(AuthGuard, RolesGuard)
export class FeedController {
  constructor(private readonly feed: FeedService) {}
  @Get() list(@AuthUser() u:CurrentUser,@Query('page') p?:string,@Query('limit') l?:string){return this.feed.list(u,Number(p)||1,Number(l)||20);}
  @Post() create(@AuthUser() u:CurrentUser,@Body() b:CreatePostDto){return this.feed.create(u,b);}
  @Post(':id/comments') comment(@AuthUser() u:CurrentUser,@Param('id') id:string,@Body() b:CreateCommentDto){return this.feed.comment(u,id,b);}
  @Post(':id/reactions') react(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.feed.react(u,id);}
  @Delete(':id') remove(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.feed.remove(u,id);}
}