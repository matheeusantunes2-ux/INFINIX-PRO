import { IsString, Length } from 'class-validator';
export class AcceptInvitationDto {
  @IsString() @Length(40, 200) token!: string;
  @IsString() @Length(12, 128) password!: string;
}
