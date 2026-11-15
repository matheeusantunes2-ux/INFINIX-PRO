import { ConflictException, Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, signAccessToken, verifyPassword } from './crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterDto, bootstrapKey?: string) {
    const configuredKey = process.env.BOOTSTRAP_ADMIN_KEY;
    if (!configuredKey || configuredKey.length < 32) {
      throw new ForbiddenException('Cadastro inicial desabilitado. Configure a chave de bootstrap no ambiente do servidor.');
    }
    if (!bootstrapKey || bootstrapKey !== configuredKey) {
      throw new ForbiddenException('Chave de autorização inválida.');
    }
    const email = input.email.trim().toLowerCase();
    const slug = input.companySlug.trim().toLowerCase();
    const [existingUser, existingCompany] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.company.findUnique({ where: { slug } }),
    ]);
    if (existingUser) throw new ConflictException('Este e-mail já está cadastrado.');
    if (existingCompany) throw new ConflictException('Este identificador de empresa já está em uso.');

    const passwordHash = await hashPassword(input.password);
    const created = await this.prisma.$transaction(async (tx) => {
      const registeredUsers = await tx.user.count();
      if (registeredUsers > 0) {
        throw new ForbiddenException('O cadastro inicial já foi utilizado. Novos usuários devem ser convidados pelo administrador.');
      }
      const company = await tx.company.create({ data: { name: input.companyName.trim(), slug } });
      const user = await tx.user.create({
        data: { name: input.name.trim(), email, passwordHash, status: 'ACTIVE' },
      });
      const membership = await tx.membership.create({
        data: { companyId: company.id, userId: user.id, role: 'OWNER', active: true },
      });
      await tx.auditLog.create({
        data: { companyId: company.id, userId: user.id, action: 'COMPANY_REGISTERED', entity: 'Company', entityId: company.id },
      });
      return { company, user, membership };
    }, { isolationLevel: 'Serializable' });
    const accessToken = signAccessToken({ sub: created.user.id, companyId: created.company.id, role: created.membership.role });
    return {
      accessToken, tokenType: 'Bearer', expiresIn: 900,
      user: { id: created.user.id, name: created.user.name, email: created.user.email },
      company: { id: created.company.id, name: created.company.name, slug: created.company.slug },
      role: created.membership.role,
    };
  }

  async login(input: LoginDto) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email }, include: { memberships: { where: { active: true }, include: { company: true } } } });
    if (!user || user.status !== 'ACTIVE' || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    const memberships = user.memberships.filter((m) => m.company.active && (!input.companySlug || m.company.slug === input.companySlug));
    if (memberships.length === 0) throw new UnauthorizedException('Nenhuma empresa ativa vinculada a este acesso.');
    if (memberships.length > 1) {
      throw new BadRequestException({ message: 'Selecione a empresa para continuar.', companies: memberships.map((m) => ({ id: m.company.id, name: m.company.name, slug: m.company.slug })) });
    }
    const membership = memberships[0];
    const accessToken = signAccessToken({ sub: user.id, companyId: membership.companyId, role: membership.role });
    return {
      accessToken, tokenType: 'Bearer', expiresIn: 900,
      user: { id: user.id, name: user.name, email: user.email },
      company: { id: membership.company.id, name: membership.company.name, slug: membership.company.slug },
      role: membership.role,
    };
  }

  async me(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, companyId, active: true, company: { active: true }, user: { status: 'ACTIVE' } },
      include: { user: true, company: true },
    });
    if (!membership) throw new UnauthorizedException('Vínculo empresarial não está ativo.');
    return {
      user: { id: membership.user.id, name: membership.user.name, email: membership.user.email },
      company: { id: membership.company.id, name: membership.company.name, slug: membership.company.slug },
      role: membership.role,
    };
  }
}
