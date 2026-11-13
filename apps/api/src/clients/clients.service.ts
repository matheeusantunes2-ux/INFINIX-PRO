import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: CurrentUser, query: string | undefined, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const where: any = { companyId: user.companyId, active: true };
    if (query?.trim()) {
      const term = query.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { document: { contains: term } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit, take: safeLimit,
        select: { id: true, name: true, email: true, phone: true, document: true, notes: true, createdAt: true, updatedAt: true },
      }),
      this.prisma.client.count({ where }),
    ]);
    return { items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
  }

  async create(user: CurrentUser, data: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: { companyId: user.companyId, name: data.name.trim(), email: data.email?.trim().toLowerCase(), phone: data.phone?.trim(), document: data.document?.trim(), notes: data.notes?.trim() },
    });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'CLIENT_CREATED', entity: 'Client', entityId: client.id } });
    return client;
  }

  async get(user: CurrentUser, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId: user.companyId, active: true },
      include: {
        _count: { select: { proposals: true, events: true, orders: true } },
        proposals: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, number: true, status: true, total: true, createdAt: true } },
        events: { orderBy: { startsAt: 'desc' }, take: 10, select: { id: true, title: true, startsAt: true, status: true } },
        orders: { orderBy: { openedAt: 'desc' }, take: 10, select: { id: true, status: true, total: true, openedAt: true } },
      },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    return client;
  }

  async update(user: CurrentUser, id: string, data: UpdateClientDto) {
    const exists = await this.prisma.client.findFirst({ where: { id, companyId: user.companyId, active: true }, select: { id: true } });
    if (!exists) throw new NotFoundException('Cliente não encontrado.');
    const updated = await this.prisma.client.update({
      where: { id }, data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
        ...(data.document !== undefined ? { document: data.document.trim() || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes.trim() || null } : {}),
      },
    });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'CLIENT_UPDATED', entity: 'Client', entityId: id } });
    return updated;
  }

  async archive(user: CurrentUser, id: string) {
    const result = await this.prisma.client.updateMany({ where: { id, companyId: user.companyId, active: true }, data: { active: false } });
    if (!result.count) throw new NotFoundException('Cliente não encontrado.');
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'CLIENT_ARCHIVED', entity: 'Client', entityId: id } });
    return { success: true, message: 'Cliente arquivado.' };
  }
}