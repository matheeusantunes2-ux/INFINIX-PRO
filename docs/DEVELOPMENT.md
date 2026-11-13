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
- `POST /api/auth/register`: cria a primeira conta, empresa e vínculo OWNER em uma transação.
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

Configure `JWT_ACCESS_SECRET` com pelo menos 32 caracteres aleatórios antes de iniciar a API. O token de acesso expira em 15 minutos. Esta etapa ainda não inclui recuperação de senha, refresh token, MFA ou limitação de tentativas; não exponha a API publicamente até essas proteções e os testes de segurança estarem concluídos.


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
