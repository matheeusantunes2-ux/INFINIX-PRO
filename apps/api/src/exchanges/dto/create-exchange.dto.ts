import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator'; import { Type } from 'class-transformer';
class ExchangeLineDto {
 @IsUUID() orderItemId!: string;
 @IsNumber() @Min(0.001) returnedQuantity!: number;
 @IsOptional() @IsUUID() replacementProductId?: string;
 @IsOptional() @IsNumber() @Min(0.001) replacementQuantity?: number;
 @IsIn(['SELLABLE','DAMAGED','DEFECTIVE']) condition!: string;
}
export class CreateExchangeDto {
 @IsUUID() orderId!: string;
 @IsString() @IsNotEmpty() @MaxLength(300) reason!: string;
 @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>ExchangeLineDto) items!: ExchangeLineDto[];
 @IsIn(['STORE_CREDIT','REFUND']) settlement!: string;
 @IsOptional() @IsIn(['CASH','PIX','CREDIT_CARD','DEBIT_CARD','TRANSFER','OTHER']) paymentMethod?: string;
 @IsOptional() @IsString() @MaxLength(500) notes?: string;
}