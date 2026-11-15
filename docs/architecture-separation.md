# Separação de arquitetura — INFINIX PRO e INFINIX PDV

## Regra obrigatória

INFINIX PRO e INFINIX PDV são produtos independentes. Não compartilhar banco, schema, tabelas, credenciais, migrations, backups ou ciclo de deploy. O banco do TORCIDA+ também é totalmente excluído.

## Destino arquitetural

### INFINIX PRO
- Repositório e serviço próprios.
- PostgreSQL exclusivo (projeto/instância independente).
- Domínios: perfis e usuários, chat, loja/catálogo, agenda, financeiro, propostas, regiões e comandas.
- Variáveis e segredos próprios.
- Migrations, backups e restauração próprios.

### INFINIX PDV
- Repositório e serviço próprios.
- PostgreSQL exclusivo (projeto/instância independente).
- Domínios: operadores, produtos/preços, estoque, vendas, pagamentos registrados, histórico, trocas/devoluções e créditos de loja.
- Variáveis e segredos próprios.
- Migrations, backups e restauração próprios.

## Isolamento operacional

1. Cada API recebe apenas a connection string do seu próprio banco.
2. Nenhum serviço recebe credenciais do outro produto.
3. Nenhum deploy executa migrations do outro produto.
4. Nenhum banco é criado como database/schema adicional dentro da instância do outro produto.
5. Falha, restauração ou rotação de credenciais de um produto não deve afetar o outro.
6. Integrações futuras, se necessárias, serão feitas por API autenticada e explicitamente autorizada — nunca por compartilhamento direto de banco.

## Estado técnico verificado

- O workflow de CI do repositório atual passou em 15/11/2026: validação do Prisma, geração do cliente, execução das migrations em PostgreSQL 16 temporário, build da API e build do frontend.
- O repositório atual ainda contém módulos dos dois produtos no mesmo monorepo. Portanto, a separação física em repositórios/serviços independentes e a criação de dois bancos externos exclusivos ainda são etapas pendentes.
- A demonstração web do PDV não deve ser considerada sistema operacional de produção até API e banco próprios estarem provisionados e conectados.

## Provisionamento gratuito

Usar somente provedores/planos gratuitos confirmados no momento da criação. Se o limite gratuito não permitir duas instâncias independentes, não reutilizar banco existente, não colocar dois produtos no mesmo banco e não contratar plano pago sem autorização. A implantação fica pendente até haver duas instâncias independentes gratuitas disponíveis.

## Checklist antes de produção

- [ ] Criar repositório independente do INFINIX PDV e transferir somente código PDV.
- [ ] Manter INFINIX PRO no seu repositório, removendo apenas componentes PDV após migração validada.
- [ ] Provisionar dois projetos PostgreSQL independentes.
- [ ] Configurar secrets distintos em cada serviço.
- [ ] Executar migrations separadas em cada banco vazio.
- [ ] Testar que cada API rejeita dados/IDs pertencentes ao outro produto.
- [ ] Testar backup e restauração independentes.
- [ ] Fazer deploy e smoke tests dos dois produtos separadamente.
- [ ] Criar a conta proprietária do PDV pelo fluxo de bootstrap seguro, sem senha compartilhada no chat.
