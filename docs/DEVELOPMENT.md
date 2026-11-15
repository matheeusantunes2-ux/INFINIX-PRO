# Desenvolvimento local

## Requisitos
- Node.js 20 ou superior
- npm 10+
- Docker com Docker Compose (ou PostgreSQL 16 instalado)

## Banco
Na raiz do projeto, copie `.env.example` para `.env` e execute:

```bash
docker compose -f infra/docker-compose.yml up -d
```

## API
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

A API fica em http://localhost:4000 e o endpoint de saúde em /health.

## Web
```bash
cd apps/web
npm install
npm run dev
```

A aplicação web fica em http://localhost:5173.

> A base inicial inclui infraestrutura e modelo de dados. Autenticação, autorização e módulos de negócio devem ser implementados antes de expor dados reais ou publicar em produção.


## Autenticação inicial

A API oferece os endpoints:
- `POST /api/auth/register`: cria a primeira conta, empresa e vínculo OWNER em uma transação. Exige o cabeçalho `x-bootstrap-key`, correspondente a `BOOTSTRAP_ADMIN_KEY` configurada no servidor (mínimo 32 caracteres), e só funciona enquanto não existir nenhum usuário. Depois do primeiro cadastro, a rota fica bloqueada.
- `POST /api/auth/login`: autentica por e-mail e senha. Se houver mais de uma empresa vinculada, informe `companySlug`.
- `GET /api/auth/me`: retorna o usuário e a empresa do token Bearer.

Exemplo de cadastro:
```json
{
  "name": "Nome do responsável",
  "email": "responsavel@empresa.com",
  "password": "uma-senha-forte-com-12",
  "companyName": "Minha Empresa",
  "companySlug": "minha-empresa"
}
```

Configure `JWT_ACCESS_SECRET` e `BOOTSTRAP_ADMIN_KEY` com pelo menos 32 caracteres aleatórios cada antes de iniciar a API. Nunca envie nem versione essas chaves. Para o cadastro inicial, envie `x-bootstrap-key` no cabeçalho da requisição; remova a variável `BOOTSTRAP_ADMIN_KEY` do ambiente assim que a conta OWNER for criada. O token de acesso expira em 15 minutos. Esta etapa ainda não inclui recuperação de senha, refresh token, MFA ou limitação de tentativas; não exponha a API publicamente até essas proteções e os testes de segurança estarem concluídos.


## Contexto empresarial e permissões

Todas as rotas privadas devem usar `AuthGuard`. O guard valida a assinatura e expiração do token e consulta novamente o vínculo ativo no PostgreSQL; usuário bloqueado, empresa inativa ou vínculo removido deixam de acessar imediatamente.

Use `@Roles('OWNER', 'ADMIN')` em rotas que exigem perfil específico e combine com `RolesGuard`. Nunca aceite `companyId` enviado pelo navegador como fonte de autorização: use sempre `companyId` derivado do usuário autenticado (`@AuthUser()`). Em toda consulta de dados de negócio, filtre pelo `companyId` do contexto autenticado.

Rotas adicionadas:
- `GET /api/company/current`: dados da empresa ativa e papel do usuário autenticado.
- `GET /api/company/members`: lista de membros ativos; disponível para OWNER, ADMIN e MANAGER.

A proteção de tenant precisa ser aplicada em cada novo serviço/repositório e coberta por testes automatizados. Não basta ocultar opções no front-end.


## Gestão de equipe (implementação inicial)

Rotas protegidas:
- `GET /api/company/members`: membros ativos da empresa do token.
- `POST /api/company/invitations`: cria convite (OWNER/ADMIN). O token de convite é retornado uma única vez para compartilhamento seguro; validade de 7 dias.
- `PATCH /api/company/members/:id/role`: altera cargo (somente OWNER).
- `PATCH /api/company/members/:id/block`: bloqueia o vínculo do membro (OWNER/ADMIN).
- `PATCH /api/company/members/:id/reactivate`: reativa o vínculo (OWNER/ADMIN).
- `PUT /api/company/members/:id/permissions`: grava permissões por módulo (OWNER/ADMIN).
- `POST /api/invitations/accept`: aceita convite e cria a conta do novo membro.

Exemplo de convite:
```json
{ "name": "Pessoa da equipe", "email": "pessoa@empresa.com", "role": "MEMBER" }
```

Exemplo de permissão:
```json
{ "module": "clients", "canView": true, "canCreate": true, "canEdit": true, "canDelete": false }
```

O token retornado pela criação deve ser enviado ao convidado por canal confiável. Ainda não existe envio automático de e-mail. Nesta versão, convites para e-mails que já possuem conta são recusados para não permitir redefinição de senha por terceiros. O bloqueio desativa o vínculo apenas nesta empresa; contas compartilhadas por outras empresas permanecem ativas nelas. As permissões por módulo já são persistidas, mas cada módulo deverá consultar essas permissões no servidor antes de autorizar ações.


## Cadastro e gestão de clientes

Rotas protegidas por autenticação e isolamento da empresa do usuário:
- `GET /api/clients?q=&page=1&limit=20`: lista paginada com pesquisa por nome, e-mail, telefone ou documento.
- `POST /api/clients`: cadastra cliente.
- `GET /api/clients/:id`: consulta cadastro e resumo de propostas, agenda e comandas relacionadas.
- `PATCH /api/clients/:id`: atualiza os dados.
- `DELETE /api/clients/:id`: arquiva o cadastro (não apaga histórico); OWNER, ADMIN e MANAGER.

O identificador da empresa é sempre obtido do token validado no servidor. A listagem e a consulta individual ignoram registros arquivados. O cadastro aceita nome obrigatório e e-mail, telefone, documento e observações opcionais. A pesquisa é paginada, com limite máximo de 100 registros por página.

A coluna `clients.active` foi adicionada ao schema Prisma para permitir arquivamento sem perder referências históricas. Antes de executar a API, gere o Prisma Client e aplique uma migration:
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name add_client_archiving
```


## Propostas comerciais

Rotas protegidas:
- `GET /api/proposals?page=1&limit=20&status=DRAFT`: lista paginada, com filtro opcional por status.
- `POST /api/proposals`: cria proposta vinculada a um cliente ativo da mesma empresa, com itens, quantidades, preços, observações e validade.
- `GET /api/proposals/:id`: consulta proposta, cliente e itens.
- `PATCH /api/proposals/:id`: altera validade e/ou itens enquanto estiver em rascunho.
- `PATCH /api/proposals/:id/status`: altera status conforme fluxo permitido; OWNER, ADMIN e MANAGER.

Exemplo de criação:
```json
{
  "clientId": "UUID-DO-CLIENTE",
  "validUntil": "2026-12-15T23:59:59.000Z",
  "notes": "Condições comerciais e prazo de entrega.",
  "items": [
    { "description": "Instalação e configuração", "quantity": 1, "unitPrice": 180.00 },
    { "description": "Suporte articulado", "quantity": 2, "unitPrice": 95.50 }
  ]
}
```

O total é calculado no servidor com Decimal (não é aceito total enviado pelo navegador). Fluxo de status: DRAFT → SENT → APPROVED ou REJECTED. Propostas aprovadas/rejeitadas não podem voltar ao fluxo anterior; propostas em rascunho são as únicas editáveis. Alterações de status e cadastro/edição geram auditoria. A consulta sempre filtra pela empresa do usuário autenticado.

Foi acrescentado o campo opcional `proposals.notes`; gere o Prisma Client e aplique migration:
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name add_proposal_notes
npm run build
```


## Agenda e agendamentos

Rotas protegidas:
- `GET /api/calendar/events?from=2026-11-01&to=2026-11-30&status=CONFIRMED&page=1&limit=50`: lista por período/status, paginada.
- `POST /api/calendar/events`: cria agendamento com cliente opcional e responsável opcional.
- `GET /api/calendar/events/:id`: consulta agendamento e seus vínculos.
- `PATCH /api/calendar/events/:id`: edita agendamento pendente/confirmado.
- `PATCH /api/calendar/events/:id/status`: confirma, cancela ou conclui conforme as transições permitidas; OWNER, ADMIN e MANAGER.

Exemplo de criação:
```json
{
  "title": "Atendimento técnico",
  "description": "Avaliação e instalação.",
  "startsAt": "2026-11-20T13:00:00.000Z",
  "endsAt": "2026-11-20T14:00:00.000Z",
  "clientId": "UUID-DO-CLIENTE",
  "assignedMembershipId": "UUID-DO-VINCULO-DO-FUNCIONARIO"
}
```

O servidor valida duração, cliente ativo e responsável ativo pertencente à mesma empresa. Verifica sobreposição de horários para o mesmo responsável, considerando eventos pendentes/confirmados. O fluxo de status é PENDING → CONFIRMED ou CANCELLED; CONFIRMED → CANCELLED ou COMPLETED. Registros cancelados/concluídos não podem ser editados. Operações geram auditoria.

O schema recebeu `assigned_membership_id` e índices para consultas por responsável. Execute:
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name assign_calendar_events
npm run build
``

A checagem de conflito é feita na aplicação; antes de operação concorrente em produção, deve ser reforçada com restrição transacional/garantia no banco e testes de concorrência. Notificações automáticas e lembretes ainda não foram conectados.
