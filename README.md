# INFINIX PRO

Plataforma SaaS multiempresa para gestão comercial e operacional.

## Módulos planejados

- Empresas, unidades, usuários, equipes e permissões (RBAC)
- Clientes e contatos
- Chat em tempo real e anexos
- Shop Feed com publicações, produtos e interações
- Agenda e agendamentos
- Financeiro: contas, lançamentos, pagamentos e recebimentos
- Propostas comerciais, itens, aprovação e geração de PDF
- Gestão de regiões, equipes e metas
- Comandas, itens e fechamento
- Auditoria, relatórios e dashboard

## Arquitetura

Monorepo com API NestJS + Prisma + PostgreSQL e aplicação web React + TypeScript. O isolamento multiempresa será aplicado no contexto autenticado e nas consultas de domínio; permissões serão verificadas no servidor.

## Estado do projeto

Fase inicial: fundação do monorepo, modelo de dados e contratos da API. Os módulos serão implementados e testados progressivamente. Não considerar funcionalidades como concluídas até existirem operações persistentes e testes.

## Desenvolvimento local

Consulte `docs/DEVELOPMENT.md` e `infra/docker-compose.yml`.

## Segurança

Nunca versione segredos. Copie `.env.example` para `.env` e configure valores próprios. Em produção, use HTTPS, cookies/tokens seguros, backups e políticas de acesso restritivas.
