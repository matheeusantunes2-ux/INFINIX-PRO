import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ProposalItemDto } from './proposal-item.dto';

export class CreateProposalDto {
  @IsUUID() clientId!: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => ProposalItemDto)
  items!: ProposalItemDto[];
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}