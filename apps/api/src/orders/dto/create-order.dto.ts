import {ArrayMinSize,IsArray,IsNumber,IsOptional,IsString,IsUUID,MaxLength,Min,ValidateNested} from 'class-validator'; import {Type} from 'class-transformer';
class OrderLineDto { @IsUUID() productId!:string; @Type(()=>Number) @IsNumber({maxDecimalPlaces:3}) @Min(0.001) quantity!:number; }
export class CreateOrderDto {
 @IsOptional() @IsUUID() clientId?:string;
 @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>OrderLineDto) items!:OrderLineDto[];
 @IsOptional() @IsString() @MaxLength(1000) notes?:string;
}