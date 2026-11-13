import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { hashPassword } from '../auth/crypto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ModulePermissionDto } from './dto/module-permission.dto';

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
        user: { select: { id: true, name: true, email: true, status: true } },
        permissions: true },
    });
  }
  async invite(user: CurrentUser, input: InviteMemberDto) {
    if (!['OWNER', 'ADMIN'].includes(user.role)) throw new ForbiddenException('Somente proprietário ou administrador pode convidar.');
    if (user.role === 'ADMIN' && input.role === 'ADMIN') throw new ForbiddenException('Somente o proprietário pode convidar outro administrador.');
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMembership = await this.prisma.membership.findUnique({ where: { companyId_userId: { companyId: user.companyId, userId: existingUser.id } } });
      if (existingMembership) throw new ConflictException('Este usuário já possui vínculo com a empresa.');
    }
    const pending = await this.prisma.invitation.findFirst({ where: { companyId: user.companyId, email, acceptedAt: null, expiresAt: { gt: new Date() } } });
    if (pending) throw new ConflictException('Já existe um convite pendente para este e-mail.');
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invitation = await this.prisma.invitation.create({
      data: { companyId: user.companyId, email, name: input.name.trim(), role: input.role, tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub,
      action: 'MEMBER_INVITED', entity: 'Invitation', entityId: invitation.id, metadata: { email, role: input.role } } });
    // O token é exibido uma única vez; a entrega por e-mail será integrada ao provedor de notificações.
    return { id: invitation.id, email, role: invitation.role, expiresAt: invitation.expiresAt, invitationToken: token };
  }
  async acceptInvitation(input: AcceptInvitationDto) {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash }, include: { company: true } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date() || !invitation.company.active) {
      throw new BadRequestException('Convite inválido, expirado ou já utilizado.');
    }
    const passwordHash = await hashPassword(input.password);
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.upsert({
        where: { email: invitation.email },
        update: { name: invitation.name, passwordHash, status: 'ACTIVE' },
        create: { name: invitation.name, email: invitation.email, passwordHash, status: 'ACTIVE' },
      });
      const membership = await tx.membership.create({
        data: { companyId: invitation.companyId, userId: user.id, role: invitation.role, active: true },
      });
      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      await tx.auditLog.create({ data: { companyId: invitation.companyId, userId: user.id,
        action: 'INVITATION_ACCEPTED', entity: 'Membership', entityId: membership.id } });
      return { accepted: true, company: { id: invitation.company.id, name: invitation.company.name }, user: { id: user.id, name: user.name, email: user.email }, role: membership.role };
    });
  }
  async updateRole(actor: CurrentUser, membershipId: string, input: UpdateRoleDto) {
    if (actor.role !== 'OWNER') throw new ForbiddenException('Somente o proprietário pode alterar cargos.');
    const target = await this.prisma.membership.findFirst({ where: { id: membershipId, companyId: actor.companyId, active: true } });
    if (!target) throw new NotFoundException('Membro não encontrado nesta empresa.');
    if (target.userId === actor.sub) throw new BadRequestException('Não é permitido alterar o próprio cargo.');
    const updated = await this.prisma.membership.update({ where: { id: target.id }, data: { role: input.role } });
    await this.prisma.auditLog.create({ data: { companyId: actor.companyId, userId: actor.sub, action: 'MEMBER_ROLE_CHANGED', entity: 'Membership', entityId: target.id, metadata: { role: input.role } } });
    return { id: updated.id, role: updated.role };
  }
  async setMemberActive(actor: CurrentUser, membershipId: string, active: boolean) {
    if (!['OWNER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException('Sem permissão para bloquear ou reativar membros.');
    const target = await this.prisma.membership.findFirst({ where: { id: membershipId, companyId: actor.companyId, active: true }, include: { user: true } });
    if (!target) throw new NotFoundException('Membro não encontrado nesta empresa.');
    if (target.userId === actor.sub || target.role === 'OWNER') throw new BadRequestException('Não é permitido bloquear o proprietário ou o próprio acesso.');
    if (actor.role === 'ADMIN' && target.role === 'ADMIN') throw new ForbiddenException('Administrador não pode bloquear outro administrador.');
    const updated = await this.prisma.membership.update({ where: { id: target.id }, data: { active } });
    await this.prisma.auditLog.create({ data: { companyId: actor.companyId, userId: actor.sub, action: active ? 'MEMBER_REACTIVATED' : 'MEMBER_BLOCKED', entity: 'Membership', entityId: target.id } });
    return { id: updated.id, active: updated.active };
  }
  async setPermission(actor: CurrentUser, membershipId: string, input: ModulePermissionDto) {
    if (!['OWNER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException('Somente proprietário ou administrador pode alterar permissões.');
    if ((input.canCreate || input.canEdit || input.canDelete) && !input.canView) throw new BadRequestException('Permissões de alteração exigem permissão de visualização.');
    const target = await this.prisma.membership.findFirst({ where: { id: membershipId, companyId: actor.companyId, active: true } });
    if (!target || target.role === 'OWNER') throw new NotFoundException('Membro não encontrado ou protegido.');
    if (actor.role === 'ADMIN' && target.role === 'ADMIN') throw new ForbiddenException('Administrador não pode alterar permissões de outro administrador.');
    const permission = await this.prisma.modulePermission.upsert({
      where: { membershipId_module: { membershipId: target.id, module: input.module } },
      create: { membershipId: target.id, ...input },
      update: { canView: input.canView, canCreate: input.canCreate, canEdit: input.canEdit, canDelete: input.canDelete },
    });
    await this.prisma.auditLog.create({ data: { companyId: actor.companyId, userId: actor.sub, action: 'MODULE_PERMISSION_CHANGED', entity: 'ModulePermission', entityId: permission.id, metadata: { module: input.module } } });
    return permission;
  }
}
