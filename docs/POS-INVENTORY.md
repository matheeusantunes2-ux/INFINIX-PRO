# PDV, comandas e estoque

## Produtos e estoque

- `GET /api/products?q=&page=1&limit=30&lowStock=true` — catálogo paginado; lowStock filtra estoque menor ou igual ao mínimo cadastrado.
- `POST /api/products` — cria produto com preço, SKU opcional, estoque inicial e estoque mínimo.
- `GET /api/products/:id` — consulta produto e últimas movimentações.
- `PATCH /api/products/:id` — atualiza nome, SKU, preço e estoque mínimo.
- `POST /api/products/:id/stock` — entrada ou saída manual de estoque.
- `PATCH /api/products/:id/archive` — arquiva produto.

Movimentação manual:
```json
{ "direction": "IN", "quantity": 12, "reason": "Reposição do fornecedor" }
```
Para saída, use `direction: "OUT"`; o sistema impede saldo negativo.

## Comandas e PDV

- `GET /api/orders?page=1&limit=20&status=OPEN` — lista comandas.
- `POST /api/orders` — abre comanda e inclui itens do catálogo.
- `GET /api/orders/:id` — consulta comanda, cliente, itens, movimentações e lançamento financeiro.
- `POST /api/orders/:id/checkout` — finaliza venda, baixa estoque e cria receita financeira paga.
- `POST /api/orders/:id/cancel` — cancela comanda ainda aberta.

Exemplo de abertura:
```json
{
  "clientId": "UUID-DO-CLIENTE-OPCIONAL",
  "items": [
    { "productId": "UUID-DO-PRODUTO", "quantity": 2 },
    { "productId": "UUID-OUTRO-PRODUTO", "quantity": 1 }
  ],
  "notes": "Atendimento no balcão"
}
```

Finalização:
```json
{ "paymentMethod": "PIX", "reference": "NSU-OU-REFERENCIA-OPCIONAL" }
```
Formas aceitas: CASH, PIX, CREDIT_CARD, DEBIT_CARD, TRANSFER, OTHER.

O preço dos itens é obtido do catálogo no servidor; o cliente não envia preço ou total. Na finalização, dentro de uma transação PostgreSQL, o sistema verifica saldo, baixa estoque, registra movimentações, fecha a comanda e cria uma entrada INCOME/PAID em Financeiro. Se uma etapa falhar, a transação inteira é revertida. A baixa de estoque usa atualização condicional para impedir saldo negativo em vendas concorrentes.

## Banco de dados e validação

O schema acrescenta estoque e mínimo ao produto, tabela de movimentações, forma de pagamento/observações na comanda e vínculo único entre a receita e a comanda. Execute:

```bash
npm install
npx prisma generate --schema apps/api/prisma/schema.prisma
npx prisma migrate dev --schema apps/api/prisma/schema.prisma --name pos_inventory
npm run build --workspace @infinix-pro/api
```

Ainda é necessário executar migration, geração do Prisma Client, build e testes em ambiente com PostgreSQL. Não há integração com adquirente, emissão fiscal/NFC-e, impressão de cupom ou conciliação bancária nesta etapa. O registro financeiro representa a confirmação manual da forma de pagamento selecionada no checkout.
