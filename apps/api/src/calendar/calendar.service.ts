import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private dates(start: string | Date, end: string | Date) {
    const startsAt = new Date(start);
    const endsAt = new Date(end);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || startsAt >= endsAt)
      throw new BadRequestException('O horário final deve ser posterior ao inicial.');
    return { startsAt, endsAt };
  }

  private async validateRelations(companyId: string, clientId?: string | null, assignedMembershipId?: string | null) {
    if (clientId) {
      const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId, active: true }, select: { id: true } });
      if (!client) throw new NotFoundException('Cliente não encontrado nesta empresa.');
    }
    if (assignedMembershipId) {
      const member = await this.prisma.membership.findFirst({ where: { id: assignedMembershipId, companyId, active: true, user: { status: 'ACTIVE' } }, select: { id: true } });
      if (!member) throw new NotFoundException('Responsável não encontrado ou inativo nesta empresa.');
    }
  }

  private async ensureNoConflict(companyId: string, startsAt: Date, endsAt: Date, assignedMembershipId?: string | null, excludeId?: string) {
    if (!assignedMembershipId) return;
    const conflict = await this.prisma.calendarEvent.findFirst({
      where: { companyId, assignedMembershipId, status: { in: ['PENDING', 'CONFIRMED'] },
        startsAt: { lt: endsAt }, endsAt: { gt: startsAt }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true, title: true, startsAt: true, endsAt: true },
    });
    if (conflict) throw new BadRequestException({ message: 'O responsável já possui um compromisso nesse horário.', conflict });
  }

  async list(user: CurrentUser, from?: string, to?: string, status?: string, page = 1, limit = 50) {
    const p = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const allowed = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (status && !allowed.includes(status)) throw new BadRequestException('Status inválido.');
    const range: any = {};
    if (from) { const d = new Date(from); if (!Number.isFinite(d.getTime())) throw new BadRequestException('Data inicial inválida.'); range.gte = d; }
    if (to) { const d = new Date(to); if (!Number.isFinite(d.getTime())) throw new BadRequestException('Data final inválida.'); range.lte = d; }
    if (range.gte && range.lte && range.gte > range.lte) throw new BadRequestException('Período inválido.');
    const where: any = { companyId: user.companyId, ...(status ? { status } : {}), ...(Object.keys(range).length ? { startsAt: range } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.calendarEvent.findMany({ where, orderBy: { startsAt: 'asc' }, skip: (p - 1) * take, take,
        include: { client: { select: { id: true, name: true, phone: true, email: true } },
          assignedMembership: { include: { user: { select: { id: true, name: true, email: true } } } } } }),
      this.prisma.calendarEvent.count({ where }),
    ]);
    return { items, pagination: { page: p, limit: take, total, pages: Math.ceil(total / take) } };
  }

  async create(user: CurrentUser, dto: CreateEventDto) {
    const { startsAt, endsAt } = this.dates(dto.startsAt, dto.endsAt);
    await this.validateRelations(user.companyId, dto.clientId, dto.assignedMembershipId);
    await this.ensureNoConflict(user.companyId, startsAt, endsAt, dto.assignedMembershipId);
    const event = await this.prisma.calendarEvent.create({ data: {
      companyId: user.companyId, title: dto.title.trim(), description: dto.description?.trim() || null,
      startsAt, endsAt, clientId: dto.clientId || null, assignedMembershipId: dto.assignedMembershipId || null,
    }, include: { client: true, assignedMembership: { include: { user: { select: { id: true, name: true, email: true } } } } } });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'CALENDAR_EVENT_CREATED', entity: 'CalendarEvent', entityId: event.id } });
    return event;
  }

  async get(user: CurrentUser, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, companyId: user.companyId },
      include: { client: true, assignedMembership: { include: { user: { select: { id: true, name: true, email: true } } } } } });
    if (!event) throw new NotFoundException('Agendamento não encontrado.');
    return event;
  }

  async update(user: CurrentUser, id: string, dto: UpdateEventDto) {
    const current = await this.prisma.calendarEvent.findFirst({ where: { id, companyId: user.companyId } });
    if (!current) throw new NotFoundException('Agendamento não encontrado.');
    if (['CANCELLED', 'COMPLETED'].includes(current.status)) throw new BadRequestException('Agendamentos cancelados ou concluídos não podem ser editados.');
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
    const dates = this.dates(startsAt, endsAt);
    const clientId = dto.clientId !== undefined ? dto.clientId : current.clientId;
    const assignedMembershipId = dto.assignedMembershipId !== undefined ? dto.assignedMembershipId : current.assignedMembershipId;
    await this.validateRelations(user.companyId, clientId, assignedMembershipId);
    await this.ensureNoConflict(user.companyId, dates.startsAt, dates.endsAt, assignedMembershipId, id);
    const updated = await this.prisma.calendarEvent.update({ where: { id }, data: {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      startsAt: dates.startsAt, endsAt: dates.endsAt, clientId, assignedMembershipId,
    }, include: { client: true, assignedMembership: { include: { user: { select: { id: true, name: true, email: true } } } } } });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'CALENDAR_EVENT_UPDATED', entity: 'CalendarEvent', entityId: id } });
    return updated;
  }

  async changeStatus(user: CurrentUser, id: string, dto: UpdateEventStatusDto) {
    const current = await this.prisma.calendarEvent.findFirst({ where: { id, companyId: user.companyId } });
    if (!current) throw new NotFoundException('Agendamento não encontrado.');
    const allowed: Record<string, string[]> = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['CANCELLED', 'COMPLETED'], CANCELLED: [], COMPLETED: [] };
    if (!allowed[current.status].includes(dto.status)) throw new BadRequestException('Transição de status não permitida.');
    const updated = await this.prisma.calendarEvent.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'CALENDAR_EVENT_STATUS_CHANGED', entity: 'CalendarEvent', entityId: id, metadata: { from: current.status, to: dto.status } } });
    return updated;
  }
}