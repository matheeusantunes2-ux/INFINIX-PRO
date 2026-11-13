import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() @MaxLength(180) email!: string;
  @IsString() @Length(12, 128) password!: string;
  @IsString() @Length(2, 120) companyName!: string;
  @IsString() @Length(3, 60) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) companySlug!: string;
}
