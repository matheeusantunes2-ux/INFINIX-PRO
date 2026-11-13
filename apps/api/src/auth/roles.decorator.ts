import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'infinix:roles';
export type AppRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
