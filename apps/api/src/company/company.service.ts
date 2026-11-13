import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}
  async current(user: CurrentUser) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.sub, companyId: user.companyId, active: true, company: { active: true } },
      include: { company: true },
    });
    if (!membership) throw new NotFoundException('Empresa não encontrada para este acesso.');
    return { id: membership.company.id, name: membership.company.name, slug: membership.company.slug,
      taxId: membership.company.taxId, role: membership.role, createdAt: membership.company.createdAt };
  }
  async members(user: CurrentUser) {
    return this.prisma.membership.findMany({
      where: { companyId: user.companyId, active: true, company: { active: true } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, role: true, active: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, status: true } } },
    });
  }
}
