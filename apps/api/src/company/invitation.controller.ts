import { Body, Controller, Post } from '@nestjs/common';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CompanyService } from './company.service';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly companies: CompanyService) {}
  @Post('accept')
  accept(@Body() body: AcceptInvitationDto) {
    return this.companies.acceptInvitation(body);
  }
}
