# Roadmap de implementação

## Fase 1 — Fundação
- [x] Repositório e monorepo
- [x] Estrutura inicial da API NestJS
- [x] Aplicação web responsiva inicial
- [x] PostgreSQL via Docker Compose
- [x] Primeiro desenho do modelo de dados multiempresa
- [ ] Validar schema Prisma com geração de client e migration inicial
- [ ] Testes automatizados e pipeline completo

## Fase 2 — Identidade e segurança
- [ ] Cadastro e ativação de empresa
- [ ] Cadastro/login/logout e recuperação de senha
- [ ] Sessões e renovação segura de credenciais
- [ ] Membership e seleção de empresa ativa
- [ ] Guards RBAC e autorização por recurso
- [ ] Auditoria de operações sensíveis
- [ ] Testes negativos de isolamento entre empresas

## Fase 3 — Operação comercial
- [ ] Clientes e contatos
- [ ] Produtos e catálogo
- [ ] Propostas, itens, aprovação e PDF
- [ ] Comandas, itens, pagamentos e fechamento
- [ ] Agenda e agendamentos

## Fase 4 — Colaboração e gestão
- [ ] Chat em tempo real e anexos
- [ ] Shop Feed com mídia e interações
- [ ] Regiões, equipes e metas
- [ ] Financeiro e conciliação básica
- [ ] Dashboard e relatórios

## Fase 5 — Produção
- [ ] Armazenamento de arquivos
- [ ] Logs, métricas e alertas
- [ ] Backups e restauração testada
- [ ] Revisão de segurança e LGPD
- [ ] Deploy e documentação operacional

Nenhum item marcado como pendente deve ser tratado como funcionalidade pronta.
