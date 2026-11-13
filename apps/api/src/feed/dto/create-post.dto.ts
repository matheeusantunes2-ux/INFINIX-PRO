import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
export class CreatePostDto {
  @IsString() @MinLength(1) @MaxLength(5000) content!: string;
  @IsOptional() @IsUrl({ protocols: ['http','https'], require_protocol: true }) @MaxLength(2048) mediaUrl?: string;
  @IsOptional() @IsBoolean() announcement?: boolean;
}