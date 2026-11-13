import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyAccessToken } from './crypto';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Token ausente.');
    const claims = verifyAccessToken(authorization.slice(7));
    if (!claims) throw new UnauthorizedException('Token inválido ou expirado.');
    request.user = claims;
    return true;
  }
}
