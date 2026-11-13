import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { PayEntryDto } from './dto/pay-entry.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: CurrentUser, page = 1, limit = 20, type?: string, status?: string, category?: string, from?: string, to?: string, overdue?: string, unitId?: string) {
    const p = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(limit) || 20));
    if (type && !Object.values(TransactionType).includes(type as TransactionType)) throw new BadRequestException('Tipo financeiro inválido.');
    if (status && !Object.values(TransactionStatus).includes(status as TransactionStatus)) throw new BadRequestException('Status financeiro inválido.');
    const dueAt: Prisma.DateTimeFilter = {};
    if (from) { const d = new Date(from); if (!Number.isFinite(d.getTime())) throw new BadRequestException('Data inicial inválida.'); dueAt.gte = d; }
    if (to) { const d = new Date(to); if (!Number.isFinite(d.getTime())) throw new BadRequestException('Data final inválida.'); dueAt.lte = d; }
    if (dueAt.gte && dueAt.lte && dueAt.gte > dueAt.lte) throw new BadRequestException('Período inválido.');
    const where: Prisma.FinancialEntryWhereInput = {
      companyId: user.companyId,
      ...(unitId ? { unitId } : {}),
      ...(type ? { type: type as TransactionType } : {}),
      ...(status ? { status: status as TransactionStatus } : {}),
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(Object.keys(dueAt).length ? { dueAt } : {}),
      ...(overdue === 'true' ? { status: 'PENDING', dueAt: { lt: new Date(), ...(from ? { gte: new Date(from) } : {}) } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.financialEntry.findMany({ where, orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }], skip: (p - 1) * take, take }),
      this.prisma.financialEntry.count({ where }),
    ]);
    return { items, pagination: { page: p, limit: take, total, pages: Math.ceil(total / take) } };
  }

  async create(user: CurrentUser, dto: CreateEntryDto) {
    if (dto.unitId) {
      const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, companyId: user.companyId }, select: { id: true } });
      if (!unit) throw new BadRequestException('Unidade inválida para esta empresa.');
    }
    const dueAt = new Date(dto.dueAt);
    if (!Number.isFinite(dueAt.getTime())) throw new BadRequestException('Vencimento inválido.');
    const entry = await this.prisma.$transaction(async tx => {
      const created = await tx.financialEntry.create({ data: {
        companyId: user.companyId, type: dto.type, description: dto.description.trim(),
        amount: new Prisma.Decimal(dto.amount), dueAt, category: dto.category?.trim() || null,
        paymentMethod: dto.paymentMethod?.trim() || null, unitId: dto.unitId || null, reference: dto.reference?.trim() || null, notes: dto.notes?.trim() || null,
      }});
      await tx.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'FINANCIAL_ENTRY_CREATED', entity: 'FinancialEntry', entityId: created.id } });
      return created;
    });
    return entry;
  }

  async get(user: CurrentUser, id: string) {
    const entry = await this.prisma.financialEntry.findFirst({ where: { id, companyId: user.companyId } });
    if (!entry) throw new NotFoundException('Lançamento financeiro não encontrado.');
    return entry;
  }

  async update(user: CurrentUser, id: string, dto: UpdateEntryDto) {
    const data: Prisma.FinancialEntryUpdateManyMutationInput = {
      ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(dto.amount) } : {}),
      ...(dto.dueAt !== undefined ? { dueAt: new Date(dto.dueAt) } : {}),
      ...(dto.category !== undefined ? { category: dto.category?.trim() || null } : {}),
      ...(dto.unitId !== undefined ? { unitId: dto.unitId || null } : {}),
      ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod?.trim() || null } : {}),
      ...(dto.reference !== undefined ? { reference: dto.reference?.trim() || null } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
    };
    if (dto.unitId) {
      const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, companyId: user.companyId }, select: { id: true } });
      if (!unit) throw new BadRequestException('Unidade inválida para esta empresa.');
    }
    if (dto.dueAt && !Number.isFinite(new Date(dto.dueAt).getTime())) throw new BadRequestException('Vencimento inválido.');
    const result = await this.prisma.financialEntry.updateMany({ where: { id, companyId: user.companyId, status: 'PENDING' }, data });
    if (!result.count) {
      const exists = await this.prisma.financialEntry.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
      if (!exists) throw new NotFoundException('Lançamento financeiro não encontrado.');
      throw new BadRequestException('Somente lançamentos pendentes podem ser editados.');
    }
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'FINANCIAL_ENTRY_UPDATED', entity: 'FinancialEntry', entityId: id } });
    return this.get(user, id);
  }

  async pay(user: CurrentUser, id: string, dto: PayEntryDto) {
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    if (!Number.isFinite(paidAt.getTime())) throw new BadRequestException('Data de pagamento inválida.');
    const result = await this.prisma.financialEntry.updateMany({
      where: { id, companyId: user.companyId, status: 'PENDING' },
      data: { status: 'PAID', paidAt, ...(dto.paymentMethod ? { paymentMethod: dto.paymentMethod.trim() } : {}), ...(dto.reference ? { reference: dto.reference.trim() } : {}) },
    });
    if (!result.count) {
      const exists = await this.prisma.financialEntry.findFirst({ where: { id, companyId: user.companyId }, select: { status: true } });
      if (!exists) throw new NotFoundException('Lançamento financeiro não encontrado.');
      throw new BadRequestException('Este lançamento não está pendente.');
    }
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'FINANCIAL_ENTRY_PAID', entity: 'FinancialEntry', entityId: id } });
    return this.get(user, id);
  }

  async cancel(user: CurrentUser, id: string) {
    const result = await this.prisma.financialEntry.updateMany({ where: { id, companyId: user.companyId, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    if (!result.count) {
      const exists = await this.prisma.financialEntry.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
      if (!exists) throw new NotFoundException('Lançamento financeiro não encontrado.');
      throw new BadRequestException('Somente lançamentos pendentes podem ser cancelados.');
    }
    await this.prisma.auditLog.create({ data: { companyId: user.companyId, userId: user.sub, action: 'FINANCIAL_ENTRY_CANCELLED', entity: 'FinancialEntry', entityId: id } });
    return this.get(user, id);
  }


  async reports(user: CurrentUser, from?: string, to?: string, unitId?: string) {
    const start = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = to ? new Date(to) : new Date();
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end)
      throw new BadRequestException('Período inválido.');
    if (unitId) {
      const unit = await this.prisma.unit.findFirst({ where: { id: unitId, companyId: user.companyId }, select: { id: true } });
      if (!unit) throw new BadRequestException('Unidade inválida para esta empresa.');
    }
    const baseWhere = { companyId: user.companyId, ...(unitId ? { unitId } : {}) };
    const [entries, cashEntries, overdueEntries] = await this.prisma.$transaction([
      this.prisma.financialEntry.findMany({
        where: { ...baseWhere, dueAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
        select: { id: true, type: true, status: true, amount: true, dueAt: true, unitId: true, unit: { select: { name: true } } },
        orderBy: { dueAt: 'asc' },
      }),
      this.prisma.financialEntry.findMany({
        where: { ...baseWhere, status: 'PAID', paidAt: { gte: start, lte: end } },
        select: { type: true, amount: true, unitId: true, unit: { select: { name: true } } },
      }),
      this.prisma.financialEntry.findMany({
        where: { ...baseWhere, status: 'PENDING', dueAt: { lt: end } },
        select: { amount: true, dueAt: true },
      }),
    ]);
    const zero = () => new Prisma.Decimal(0);
    const totals = { income: zero(), expense: zero(), received: zero(), paid: zero(), pendingIncome: zero(), pendingExpense: zero() };
    const aging = { days1to30: zero(), days31to60: zero(), days61plus: zero() };
    const byUnit: Record<string, { unit: string; income: Prisma.Decimal; expense: Prisma.Decimal; paid: Prisma.Decimal; received: Prisma.Decimal }> = {};
    for (const e of entries) {
      const amount = new Prisma.Decimal(e.amount);
      const key = e.unitId || 'unassigned';
      byUnit[key] ||= { unit: e.unit?.name || 'Sem unidade', income: zero(), expense: zero(), paid: zero(), received: zero() };
      if (e.type === 'INCOME') {
        totals.income = totals.income.plus(amount); byUnit[key].income = byUnit[key].income.plus(amount);
        if (e.status === 'PENDING') totals.pendingIncome = totals.pendingIncome.plus(amount);
      } else {
        totals.expense = totals.expense.plus(amount); byUnit[key].expense = byUnit[key].expense.plus(amount);
        if (e.status === 'PENDING') totals.pendingExpense = totals.pendingExpense.plus(amount);
      }
    }
    for (const e of cashEntries) {
      const amount = new Prisma.Decimal(e.amount);
      const key = e.unitId || 'unassigned';
      byUnit[key] ||= { unit: e.unit?.name || 'Sem unidade', income: zero(), expense: zero(), paid: zero(), received: zero() };
      if (e.type === 'INCOME') { totals.received = totals.received.plus(amount); byUnit[key].received = byUnit[key].received.plus(amount); }
      else { totals.paid = totals.paid.plus(amount); byUnit[key].paid = byUnit[key].paid.plus(amount); }
    }
    for (const e of overdueEntries) {
      const amount = new Prisma.Decimal(e.amount);
      const days = Math.floor((end.getTime() - e.dueAt.getTime()) / 86400000);
      if (days <= 30) aging.days1to30 = aging.days1to30.plus(amount);
      else if (days <= 60) aging.days31to60 = aging.days31to60.plus(amount);
      else aging.days61plus = aging.days61plus.plus(amount);
    }
    const fmt = (v: Prisma.Decimal) => v.toFixed(2);
    return {
      period: { from: start, to: end },
      totals: {
        income: fmt(totals.income), expense: fmt(totals.expense),
        accruedResult: fmt(totals.income.minus(totals.expense)),
        received: fmt(totals.received), paid: fmt(totals.paid),
        cashResult: fmt(totals.received.minus(totals.paid)),
        pendingIncome: fmt(totals.pendingIncome), pendingExpense: fmt(totals.pendingExpense),
      },
      overdueAging: { days1to30: fmt(aging.days1to30), days31to60: fmt(aging.days31to60), days61plus: fmt(aging.days61plus) },
      byUnit: Object.entries(byUnit).map(([unitId, v]) => ({ unitId: unitId === 'unassigned' ? null : unitId, unit: v.unit, income: fmt(v.income), expense: fmt(v.expense), received: fmt(v.received), paid: fmt(v.paid), cashResult: fmt(v.received.minus(v.paid)) })),
    };
  }

  async summary(user: CurrentUser, month?: string) {
    const now = new Date();
    const selected = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (!Number.isFinite(selected.getTime()) || !/^\d{4}-\d{2}$/.test(month || `${selected.getUTCFullYear()}-${String(selected.getUTCMonth()+1).padStart(2,'0')}`))
      throw new BadRequestException('Mês inválido. Use YYYY-MM.');
    const start = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1));
    const end = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + 1, 1));
    const [entries, overdue] = await this.prisma.$transaction([
      this.prisma.financialEntry.findMany({ where: { companyId: user.companyId, dueAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } }, select: { type: true, status: true, amount: true, category: true, dueAt: true, paidAt: true } }),
      this.prisma.financialEntry.findMany({ where: { companyId: user.companyId, status: 'PENDING', dueAt: { lt: now } }, select: { type: true, amount: true } }),
    ]);
    const zero = () => new Prisma.Decimal(0);
    let income = zero(), expense = zero(), paidIncome = zero(), paidExpense = zero(), pendingIncome = zero(), pendingExpense = zero();
    const categories: Record<string, { income: Prisma.Decimal; expense: Prisma.Decimal }> = {};
    for (const e of entries) {
      const amount = new Prisma.Decimal(e.amount);
      const key = e.category || 'Sem categoria';
      categories[key] ||= { income: zero(), expense: zero() };
      if (e.type === 'INCOME') { income = income.plus(amount); categories[key].income = categories[key].income.plus(amount); if (e.status === 'PAID') paidIncome = paidIncome.plus(amount); else pendingIncome = pendingIncome.plus(amount); }
      else { expense = expense.plus(amount); categories[key].expense = categories[key].expense.plus(amount); if (e.status === 'PAID') paidExpense = paidExpense.plus(amount); else pendingExpense = pendingExpense.plus(amount); }
    }
    const overdueTotal = overdue.reduce((sum, e) => sum.plus(e.amount), zero());
    return {
      period: { from: start, to: end },
      totals: { income: income.toFixed(2), expense: expense.toFixed(2), result: income.minus(expense).toFixed(2), paidIncome: paidIncome.toFixed(2), paidExpense: paidExpense.toFixed(2), pendingIncome: pendingIncome.toFixed(2), pendingExpense: pendingExpense.toFixed(2) },
      overdue: { count: overdue.length, total: overdueTotal.toFixed(2) },
      dre: Object.entries(categories).map(([category, values]) => ({ category, income: values.income.toFixed(2), expense: values.expense.toFixed(2), result: values.income.minus(values.expense).toFixed(2) })),
    };
  }
}