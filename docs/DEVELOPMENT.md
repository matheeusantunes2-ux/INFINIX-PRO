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
