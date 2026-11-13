# Atribuição de vendas e indicadores comerciais

## O que foi adicionado

- Toda nova comanda registra automaticamente o membership do funcionário autenticado.
- A unidade do funcionário é copiada para a comanda no momento da abertura, preservando a origem mesmo se o funcionário mudar de unidade depois.
- Listagem e consulta de comandas passam a retornar funcionário responsável e unidade.
- Novo endpoint de indicadores baseado somente em comandas fechadas.
- Indicadores: quantidade de vendas, faturamento, ticket médio, vendas por funcionário, unidade, regional e progresso de metas regionais.
- Metas são calculadas no intervalo próprio de cada meta, usando as vendas fechadas na regional e no período de vigência.
- MEMBER vê apenas suas próprias vendas; MANAGER vê vendas das regionais sob sua gestão; OWNER/ADMIN veem a empresa.

## Endpoint

`GET /api/dashboard/sales?from=2026-11-01&to=2026-11-30`

- `from` e `to` são opcionais.
- Sem parâmetros, considera o mês atual em UTC.
- Datas no formato `YYYY-MM-DD` são tratadas como dias inteiros (data final inclusiva).
- Resposta inclui `summary`, `byEmployee`, `byUnit`, `byRegion` e `goals`.

## Regra de faturamento

O dashboard soma apenas comandas com status CLOSED e data de fechamento dentro do período. Não soma comandas abertas, canceladas ou valores de lançamentos financeiros avulsos. Isso evita contar uma previsão como venda realizada.

## Atualização do banco

O modelo Order recebeu `sellerMembershipId` e `unitId`. Para aplicar em desenvolvimento:

```bash
cd apps/api
npx prisma validate
npx prisma generate
npx prisma migrate dev --name order_sales_attribution
npm run build
```

## Limitações conhecidas

- Comandas criadas antes da migration permanecem sem vendedor/unidade atribuídos; não há atribuição retroativa inventada.
- A apuração é de faturamento bruto das comandas fechadas. Estornos, devoluções, descontos, taxas de cartão e conciliação ainda precisam de regras próprias.
- A API ainda precisa passar por migration, build e testes automatizados no ambiente com PostgreSQL antes de ser considerada validada.
