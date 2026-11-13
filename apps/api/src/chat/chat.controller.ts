import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
@Controller('chat') @UseGuards(AuthGuard,RolesGuard)
export class ChatController {
  constructor(private readonly chat:ChatService){}
  @Get('conversations') list(@AuthUser() u:CurrentUser){return this.chat.list(u);}
  @Post('conversations') create(@AuthUser() u:CurrentUser,@Body() b:CreateConversationDto){return this.chat.create(u,b);}
  @Get('conversations/:id/messages') messages(@AuthUser() u:CurrentUser,@Param('id') id:string,@Query('page') p?:string,@Query('limit') l?:string){return this.chat.messages(u,id,Number(p)||1,Number(l)||50);}
  @Post('conversations/:id/messages') send(@AuthUser() u:CurrentUser,@Param('id') id:string,@Body() b:CreateMessageDto){return this.chat.send(u,id,b);}
  @Post('conversations/:id/read') read(@AuthUser() u:CurrentUser,@Param('id') id:string){return this.chat.markRead(u,id);}
}