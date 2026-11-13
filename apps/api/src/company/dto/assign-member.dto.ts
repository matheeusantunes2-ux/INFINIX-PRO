import { IsOptional, IsUUID } from 'class-validator';
export class AssignMemberDto {
  @IsOptional() @IsUUID() unitId?: string | null;
  @IsOptional() @IsUUID() regionId?: string | null;
}
