import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateConversationDto {
  @IsArray() @ArrayMinSize(1) @IsUUID('4',{each:true}) memberIds!: string[];
  @IsOptional() @IsString() @MaxLength(120) title?: string;
}