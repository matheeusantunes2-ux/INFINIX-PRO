import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ProposalItemDto } from './proposal-item.dto';

export class UpdateProposalDto {
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => ProposalItemDto)
  items?: ProposalItemDto[];
}