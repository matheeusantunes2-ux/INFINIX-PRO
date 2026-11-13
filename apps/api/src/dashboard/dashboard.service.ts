import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async sales(user: CurrentUser, from?: string, to?: string) {
    const now = new Date();
    const start = from ? new Date(from) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endInput = to ? new Date(to) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(endInput.getTime()) || endInput <= start)
      throw new BadRequestException('Período inválido. Informe datas ISO e uma data final posterior à inicial.');
    const end = new Date(endInput);
    // O parâmetro "to" é inclusivo por dia quando informado sem horário.
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) end.setUTCDate(end.getUTCDate() + 1);

    const membership = await this.prisma.membership.findFirst({
      where: { companyId: user.companyId, userId: user.sub, active: true },
      select: { id: true, regionId: true, unitId: true },
    });
    if (!membership) throw new NotFoundException('Vínculo ativo não encontrado.');

    const managedRegions = user.role === 'MANAGER'
      ? await this.prisma.region.findMany({ where: { companyId: user.companyId, managerMembershipId: membership.id }, select: { id: true } })
      : [];
    const visibleRegionIds = user.role === 'MANAGER'
      ? [...new Set([...managedRegions.map(r => r.id), ...(membership.regionId ? [membership.regionId] : [])])]
      : [];
    const where: Prisma.OrderWhereInput = {
      companyId: user.companyId,
      status: 'CLOSED',
      closedAt: { gte: start, lt: end },
      ...(user.role === 'MEMBER' ? { sellerMembershipId: membership.id } : {}),
      ...(user.role === 'MANAGER' ? {
        OR: [
          { sellerMembership: { regionId: { in: visibleRegionIds.length ? visibleRegionIds : ['00000000-0000-0000-0000-000000000000'] } } },
          { unit: { regionId: { in: visibleRegionIds.length ? visibleRegionIds : ['00000000-0000-0000-0000-000000000000'] } } },
        ],
      } : {}),
    };
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true, total: true, closedAt: true,
        sellerMembershipId: true, unitId: true,
        sellerMembership: { select: { id: true, regionId: true, user: { select: { id: true, name: true } } } },
        unit: { select: { id: true, name: true, regionId: true } },
      },
      orderBy: { closedAt: 'asc' },
    });

    const sum = (rows: typeof orders) => rows.reduce((acc, row) => acc.plus(row.total), new Prisma.Decimal(0));
    const total = sum(orders);
    const group = (key: (row: typeof orders[number]) => string | null, label: (row: typeof orders[number]) => string) => {
      const map = new Map<string, { id: string; name: string; sales: number; revenue: Prisma.Decimal }>();
      for (const row of orders) {
        const id = key(row); if (!id) continue;
        const item = map.get(id) || { id, name: label(row), sales: 0, revenue: new Prisma.Decimal(0) };
        item.sales += 1; item.revenue = item.revenue.plus(row.total); map.set(id, item);
      }
      return [...map.values()].map(v => ({ id: v.id, name: v.name, sales: v.sales, revenue: v.revenue.toFixed(2) }))
        .sort((a, b) => Number(b.revenue) - Number(a.revenue));
    };

    const regionIds = [...new Set(orders.map(o => o.sellerMembership?.regionId || o.unit?.regionId).filter((v): v is string => !!v))];
    const goalWhere: Prisma.RegionGoalWhereInput = {
      regionId: { in: regionIds.length ? regionIds : ['00000000-0000-0000-0000-000000000000'] },
      startsAt: { lt: end }, endsAt: { gte: start },
    };
    const goals = await this.prisma.regionGoal.findMany({ where: goalWhere, include: { region: { select: { id: true, name: true } } }, orderBy: { startsAt: 'asc' } });
    const regional = new Map<string, Prisma.Decimal>();
    for (const row of orders) {
      const regionId = row.sellerMembership?.regionId || row.unit?.regionId;
      if (regionId) regional.set(regionId, (regional.get(regionId) || new Prisma.Decimal(0)).plus(row.total));
    }
    return {
      period: { from: start, to: end },
      summary: { orders: orders.length, revenue: total.toFixed(2), averageTicket: orders.length ? total.div(orders.length).toFixed(2) : '0.00' },
      byEmployee: group(o => o.sellerMembership?.id || null, o => o.sellerMembership?.user.name || 'Sem responsável'),
      byUnit: group(o => o.unit?.id || null, o => o.unit?.name || 'Sem unidade'),
      byRegion: [...regional.entries()].map(([id, revenue]) => ({ id, revenue: revenue.toFixed(2) })),
      goals: goals.map(goal => {
        const goalStart = goal.startsAt > start ? goal.startsAt : start;
        const goalEnd = goal.endsAt < end ? goal.endsAt : end;
        const realized = orders.filter(row => {
          const rowRegion = row.sellerMembership?.regionId || row.unit?.regionId;
          return rowRegion === goal.regionId && row.closedAt !== null && row.closedAt >= goalStart && row.closedAt <= goalEnd;
        }).reduce((acc, row) => acc.plus(row.total), new Prisma.Decimal(0));
        const percent = goal.target.isZero() ? new Prisma.Decimal(0) : realized.div(goal.target).mul(100);
        return { id: goal.id, region: goal.region.name, title: goal.title, target: goal.target.toFixed(2),
          realized: realized.toFixed(2), progressPercent: percent.toDecimalPlaces(2).toFixed(2),
          startsAt: goal.startsAt, endsAt: goal.endsAt };
      }),
    };
  }
}
