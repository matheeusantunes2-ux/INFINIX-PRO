# Gestão de unidades, regionais e equipes

## O que foi adicionado

- Unidades vinculadas à empresa e opcionalmente a uma regional.
- Regionais com gerente responsável (membership ativo com papel MANAGER).
- Vínculo de cada funcionário a uma unidade e/ou regional.
- Metas financeiras por regional e período.
- Consultas respeitam o tenant autenticado; o cliente nunca informa companyId.
- Auditoria para criação de unidades/regionais/metas e alterações de alocação.
- OWNER/ADMIN administram estrutura; MANAGER consulta apenas sua regional; MEMBER consulta a regional/unidade à qual está vinculado.

## Endpoints

- `GET /api/company/units`
- `POST /api/company/units` — OWNER/ADMIN; body: `{ "name": "Unidade Centro", "regionId": "<uuid opcional>" }`
- `GET /api/company/regions`
- `POST /api/company/regions` — OWNER/ADMIN; body: `{ "name": "Regional Sul", "managerMembershipId": "<uuid opcional>" }`
- `PATCH /api/company/members/:id/assignment` — OWNER/ADMIN; body: `{ "unitId": "<uuid|null>", "regionId": "<uuid|null>" }`
- `POST /api/company/regions/:id/goals` — OWNER/ADMIN; body: `{ "title": "Meta mensal", "target": 50000, "startsAt": "2026-11-01T00:00:00.000Z", "endsAt": "2026-11-30T23:59:59.999Z" }`

## Observações e limites atuais

- Metas são cadastradas e consultáveis na regional, mas o realizado ainda não é calculado. As vendas atuais não registram unidade/funcionário de origem de forma confiável; publicar um atingimento agora produziria indicador incorreto. A próxima evolução deve atribuir a comanda ao membership e à unidade no momento da abertura, e consolidar vendas pagas por período.
- O campo legado `Region.managerId` foi preservado; o novo vínculo funcional usa `managerMembershipId`.
- A estrutura do banco mudou. Antes de executar a API, gere o Prisma Client e aplique uma migration em ambiente de desenvolvimento.

## Migration

```bash
cd apps/api
npx prisma validate
npx prisma generate
npx prisma migrate dev --name team_hierarchy
```
