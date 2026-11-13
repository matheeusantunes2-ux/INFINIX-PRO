import {ArrayMinSize,IsArray,IsOptional,IsString,IsUUID,MaxLength,ValidateNested} from 'class-validator'; import {Type} from 'class-transformer';
class OrderLineDto { @IsUUID() productId!:string; @Type(()=>Number) quantity!:number; }
export class CreateOrderDto {
 @IsOptional() @IsUUID() clientId?:string;
 @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>OrderLineDto) items!:OrderLineDto[];
 @IsOptional() @IsString() @MaxLength(1000) notes?:string;
}