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
