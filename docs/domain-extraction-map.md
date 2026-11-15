# Inventário de domínios para extração dos produtos

Este inventário orienta a extração sem apagar ou mover módulos do produto original antes de haver repositório de destino e CI verde.

## INFINIX PRO
Modelos identificados no schema Prisma:
- Identidade e organização PRO: Company, User, Membership, Unit, Region, RegionGoal, ModulePermission, Invitation.
- Clientes e propostas: Client, Proposal, ProposalItem.
- Agenda: CalendarEvent.
- Feed e comunicação: FeedPost, FeedComment, FeedReaction, Conversation, ConversationMember, Message, MessageRead.
- Financeiro PRO: FinancialEntry.
- Notificações e auditoria: Notification, AuditLog.

Módulos API presentes: auth, calendar, chat, clients, company, dashboard, feed, finance, notifications, proposals.

## INFINIX PDV
Modelos identificados:
- Catálogo e estoque: Product, StockMovement.
- Vendas: Order, OrderItem.
- Trocas: Exchange, ExchangeItem.
- Crédito de loja: StoreCredit.
- Identidade do PDV: precisa ser local (PdvCompany, PdvUser, PdvMembership), sem FK nem autenticação compartilhada com INFINIX PRO.

Módulos API presentes: products, orders, exchanges. O módulo auth atual está acoplado ao modelo Company/User/Membership comum e precisa ser substituído por autenticação local do PDV na extração.

## Decisões para extração segura
1. Não copiar o schema Prisma inteiro para os dois produtos: isso replicaria tabelas e domínios desnecessários.
2. Não remover módulos do monorepo atual antes de confirmar o repositório de destino, build e deploy do novo PDV.
3. Ao extrair, criar identidade e papéis locais do PDV, sem compartilhar usuários do PRO.
4. Nenhuma relação Prisma/FK pode cruzar bancos. IDs externos, se necessários, trafegam apenas por APIs autenticadas.
5. Cada serviço recebe sua própria variável DATABASE_URL e secret; os valores e recursos de banco nunca são compartilhados.
6. Só marcar a separação como concluída após provar em CI que cada schema migra em PostgreSQL vazio separado e que os dois builds funcionam.

## Limitação atual
A integração GitHub disponível nesta execução não expõe criação de repositório novo. Por isso, a extração física para INFINIX-PDV não pode ser concluída por esta ação. Não simular a criação do repositório nem alterar o repositório atual de forma destrutiva. Criar/habilitar o repositório destino no GitHub é o próximo pré-requisito; depois a extração pode ser feita preservando o histórico do INFINIX-PRO.
