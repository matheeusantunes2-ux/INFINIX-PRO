import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional() @IsString() @MaxLength(180) description?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string | null;
  @IsOptional() @IsUUID() unitId?: string | null;
  @IsOptional() @IsString() @MaxLength(80) paymentMethod?: string | null;
  @IsOptional() @IsString() @MaxLength(120) reference?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
}