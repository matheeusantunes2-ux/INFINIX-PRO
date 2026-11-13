import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyAccessToken } from './crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Token ausente.');
    const claims = verifyAccessToken(authorization.slice(7));
    if (!claims) throw new UnauthorizedException('Token inválido ou expirado.');
    const membership = await this.prisma.membership.findFirst({
      where: { userId: claims.sub, companyId: claims.companyId, active: true,
        role: claims.role as any, user: { status: 'ACTIVE' }, company: { active: true } },
      select: { id: true, role: true },
    });
    if (!membership) throw new UnauthorizedException('Acesso empresarial revogado ou inativo.');
    request.user = { sub: claims.sub, companyId: claims.companyId, role: membership.role };
    return true;
  }
}
