import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type AuthenticatedRequest = Request & { user: { sub: string; companyId: string; role: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto, @Headers('x-bootstrap-key') bootstrapKey?: string) { return this.auth.register(body, bootstrapKey); }

  @Post('login')
  login(@Body() body: LoginDto) { return this.auth.login(body); }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.me(request.user.sub, request.user.companyId);
  }
}
