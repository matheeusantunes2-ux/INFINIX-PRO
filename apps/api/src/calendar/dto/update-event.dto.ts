import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateEventDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(3000) description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @IsUUID() assignedMembershipId?: string;
}