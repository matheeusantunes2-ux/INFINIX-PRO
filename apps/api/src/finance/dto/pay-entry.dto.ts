import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class PayEntryDto {
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsString() @MaxLength(80) paymentMethod?: string;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
}