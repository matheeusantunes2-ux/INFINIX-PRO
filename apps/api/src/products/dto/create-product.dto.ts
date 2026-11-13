import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class CreateProductDto {
 @IsString() @MaxLength(160) name!: string;
 @IsOptional() @IsString() @MaxLength(80) sku?: string;
 @IsNumber({maxDecimalPlaces:2}) @Min(0.01) price!: number;
 @IsOptional() @IsNumber({maxDecimalPlaces:3}) @Min(0) stock?: number;
 @IsOptional() @IsNumber({maxDecimalPlaces:3}) @Min(0) minStock?: number;
}