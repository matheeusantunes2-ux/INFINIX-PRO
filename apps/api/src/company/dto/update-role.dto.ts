import { IsIn } from 'class-validator';
export class UpdateRoleDto {
  @IsIn(['ADMIN', 'MANAGER', 'MEMBER']) role!: 'ADMIN' | 'MANAGER' | 'MEMBER';
}
