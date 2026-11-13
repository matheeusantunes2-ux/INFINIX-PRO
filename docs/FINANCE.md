# Módulo financeiro

O módulo usa o tenant da sessão autenticada; nenhum endpoint aceita `companyId` do cliente.

## Endpoints

- `GET /api/finance/entries` — lista paginada. Filtros: `page`, `limit`, `type=INCOME|EXPENSE`, `status=PENDING|PAID|CANCELLED`, `category`, `from`, `to`, `overdue=true`.
- `POST /api/finance/entries` — cria lançamento.
- `GET /api/finance/entries/:id` — consulta lançamento.
- `PATCH /api/finance/entries/:id` — edita lançamento pendente.
- `PATCH /api/finance/entries/:id/pay` — registra pagamento/recebimento.
- `PATCH /api/finance/entries/:id/cancel` — cancela lançamento pendente.
- `GET /api/finance/summary?month=YYYY-MM` — resumo mensal, valores pagos/pendentes, vencidos e DRE gerencial por categoria.
- `GET /api/finance/reports?from=2026-11-01&to=2026-11-30&unitId=<uuid>` — fluxo de caixa realizado, resultado por competência, inadimplência por faixa de atraso e consolidação por unidade.
- O filtro `unitId` também pode ser usado em `GET /api/finance/entries`.
- Lançamentos podem receber `unitId` no cadastro e na edição. A API valida se a unidade pertence à empresa autenticada; lançamentos sem unidade ficam em “Sem unidade”.

## Exemplo de criação

```json
{
  "type": "EXPENSE",
  "description": "Aluguel da unidade",
  "amount": 2500.00,
  "dueAt": "2026-11-10T12:00:00.000Z",
  "category": "Ocupação",
  "unitId": "UUID-DA-UNIDADE",
  "paymentMethod": "PIX",
  "reference": "ALUGUEL-11-2026",
  "notes": "Sala comercial"
}
```

Valores monetários são persistidos como Decimal (14,2) e os totais do resumo são retornados como strings decimais para evitar arredondamento binário. Lançamentos pagos ou cancelados não podem ser editados; somente pendentes podem ser pagos ou cancelados. Ações de criação, edição, pagamento e cancelamento geram auditoria.

## Atualização do banco

O schema Prisma adicionou metadados de pagamento, referência, observações e updatedAt em FinancialEntry. Após obter o repositório:

```bash
npm install
npx prisma generate --schema apps/api/prisma/schema.prisma
npx prisma migrate dev --schema apps/api/prisma/schema.prisma --name finance_entry_metadata
npm run build --workspace @infinix-pro/api
```

A migration e o build ainda precisam ser executados em ambiente com PostgreSQL e dependências instaladas. O resumo DRE é gerencial e não substitui escrituração contábil/fiscal.

## Relatório financeiro avançado

O relatório separa valores por competência (vencimento) e caixa (pagamentos/recebimentos efetivamente registrados). A análise de atraso agrupa lançamentos pendentes vencidos em 1–30, 31–60 e mais de 60 dias. A consolidação por unidade inclui entradas e saídas associadas; registros sem unidade aparecem em “Sem unidade”. Não é conciliação bancária nem DRE contábil oficial. O relatório utiliza o tenant da sessão e valida a unidade informada contra a empresa autenticada.
