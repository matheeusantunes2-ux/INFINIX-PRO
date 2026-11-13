import { IsBoolean, IsIn } from 'class-validator';
export class ModulePermissionDto {
  @IsIn(['clients', 'chat', 'feed', 'calendar', 'finance', 'proposals', 'regions', 'orders', 'team']) module!: string;
  @IsBoolean() canView!: boolean;
  @IsBoolean() canCreate!: boolean;
  @IsBoolean() canEdit!: boolean;
  @IsBoolean() canDelete!: boolean;
}
