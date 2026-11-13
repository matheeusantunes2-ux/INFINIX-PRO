import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail() @MaxLength(180) email!: string;
  @IsString() @Length(12, 128) password!: string;
  @IsOptional() @IsString() @Length(3, 60) companySlug?: string;
}
