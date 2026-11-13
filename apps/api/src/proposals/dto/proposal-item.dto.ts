import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class ProposalItemDto {
  @IsString() @MinLength(2) @MaxLength(240) description!: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) quantity!: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) unitPrice!: number;
}