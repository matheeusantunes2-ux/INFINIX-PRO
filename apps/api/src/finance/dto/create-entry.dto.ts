import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateEntryDto {
  @IsEnum(TransactionType) type!: TransactionType;
  @IsString() @MaxLength(180) description!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount!: number;
  @IsDateString() dueAt!: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(80) paymentMethod?: string;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}