import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface CurrentUser {
  sub: string;
  companyId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
}
export const AuthUser = createParamDecorator((_data: unknown, context: ExecutionContext): CurrentUser =>
  context.switchToHttp().getRequest().user as CurrentUser,
);
