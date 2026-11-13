import { IsEmail, IsIn, IsString, Length, MaxLength } from 'class-validator';
export class InviteMemberDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() @MaxLength(180) email!: string;
  @IsIn(['ADMIN', 'MANAGER', 'MEMBER']) role!: 'ADMIN' | 'MANAGER' | 'MEMBER';
}
