import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';

@Injectable()
export class ProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  private makeItems(items: { description: string; quantity: number; unitPrice: number }[]) {
    let total = new Prisma.Decimal(0);
    const data = items.map((item) => {
      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const lineTotal = quantity.mul(unitPrice).toDecimalPlaces(2);
      total = total.plus(lineTotal);
      return { description: item.description.trim(), quantity, unitPrice, total: lineTotal };
    });
    if (total.greaterThan('999999999999.99')) throw new BadRequestException('Valor total excede o limite permitido.');
    return { data, total: total.toDecimalPlaces(2) };
  }

  async list(user: CurrentUser, page = 1, limit = 20, status?: string) {
    const p = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 20));
    const allowed = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];
    if (status && !allowed.includes(status)) throw new BadRequestException('Status inválido.');
    const where = { companyId: user.companyId, ...(status ? { status: status as any } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.proposal.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p - 1) * take, take,
        include: { client: { select: { id: true, name: true, email: true, phone: true } }, _count: { select: { items: true } } } }),
      this.prisma.proposal.count({ where }),
    ]);
    return { items, pagination: { page: p, limit: take, total, pages: Math.ceil(total / take) } };
  }

  async create(user: CurrentUser, dto: CreateProposalDto) {
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, companyId: user.companyId, active: true }, select: { id: true } });
    if (!client) throw new NotFoundException('Cliente não encontrado nesta empresa.');
    const calculated = this.makeItems(dto.items);
    const number = `PROP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomUUID().slice(0,6).toUpperCase()}`;
    const proposal = await this.prisma.proposal.create({
      data: { companyId: user.companyId, clientId: client.id, number, total: calculated.total,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null, notes: dto.notes?.trim() || null,
        items: { create: calculated.data } },
      include: { client: { select: { id: true, name: true, email: true, phone: true } }, items: true },
    });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'PROPOSAL_CREATED', entity: 'Proposal', entityId: proposal.id, metadata: { number, total: calculated.total.toString() } } });
    return proposal;
  }

  async get(user: CurrentUser, id: string) {
    const proposal = await this.prisma.proposal.findFirst({ where: { id, companyId: user.companyId },
      include: { client: true, items: true } });
    if (!proposal) throw new NotFoundException('Proposta não encontrada.');
    return proposal;
  }

  async update(user: CurrentUser, id: string, dto: UpdateProposalDto) {
    const current = await this.prisma.proposal.findFirst({ where: { id, companyId: user.companyId } });
    if (!current) throw new NotFoundException('Proposta não encontrada.');
    if (current.status !== 'DRAFT') throw new BadRequestException('Somente propostas em rascunho podem ser editadas.');
    const calculated = dto.items ? this.makeItems(dto.items) : null;
    const updated = await this.prisma.$transaction(async (tx) => {
      if (calculated) await tx.proposalItem.deleteMany({ where: { proposalId: id } });
      return tx.proposal.update({ where: { id }, data: {
        ...(dto.validUntil !== undefined ? { validUntil: new Date(dto.validUntil) } : {}),
        ...(calculated ? { total: calculated.total, items: { create: calculated.data } } : {}),
      }, include: { client: { select: { id: true, name: true } }, items: true } });
    });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'PROPOSAL_UPDATED', entity: 'Proposal', entityId: id } });
    return updated;
  }

  async changeStatus(user: CurrentUser, id: string, dto: UpdateProposalStatusDto) {
    const current = await this.prisma.proposal.findFirst({ where: { id, companyId: user.companyId } });
    if (!current) throw new NotFoundException('Proposta não encontrada.');
    const valid = (current.status === 'DRAFT' && dto.status === 'SENT') ||
      (current.status === 'SENT' && ['APPROVED', 'REJECTED'].includes(dto.status));
    if (!valid) throw new BadRequestException('Transição de status não permitida.');
    if (current.validUntil && current.validUntil < new Date() && dto.status !== 'REJECTED')
      throw new BadRequestException('A validade da proposta expirou.');
    const updated = await this.prisma.proposal.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: `PROPOSAL_${dto.status}`, entity: 'Proposal', entityId: id, metadata: { from: current.status, to: dto.status } } });
    return updated;
  }
}