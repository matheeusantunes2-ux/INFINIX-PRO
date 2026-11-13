# Etapa 12 — validação técnica

## Correções aplicadas nesta etapa
- O frontend passa a usar `http://localhost:4000/api` por padrão, alinhado à porta padrão da API.
- O formulário de acesso exige senha com no mínimo 12 caracteres, conforme os DTOs de autenticação.
- O workflow de CI usa `JWT_ACCESS_SECRET`, variável realmente lida pelo serviço de autenticação.
- Adicionado o gatilho manual `workflow_dispatch` para permitir executar a validação pelo GitHub Actions.

## Validação automatizada configurada
O workflow `.github/workflows/ci.yml` executa:
1. Instalação das dependências com Node.js 20.
2. Validação do schema Prisma.
3. Geração do Prisma Client.
4. Build NestJS da API.
5. Build TypeScript/Vite do frontend.

A CI não executa migração em banco de produção nem testes de integração. O sucesso do build não significa que o sistema está pronto para produção.

## Como executar manualmente
No GitHub, abra Actions → CI → Run workflow. Aguarde os jobs `api-check` e `web-build`. Só considerar a etapa de compilação aprovada se ambos terminarem com sucesso.

## Validação local
Na raiz do repositório:
```bash
npm install
npx prisma validate --schema apps/api/prisma/schema.prisma
npx prisma generate --schema apps/api/prisma/schema.prisma
npm run build:api
npm run build:web
```

Para testar operações reais, configure PostgreSQL com `.env`, aplique uma migração em ambiente de desenvolvimento e teste os fluxos com duas empresas distintas. Nunca use dados reais ou banco de produção nos testes.

## Pontos que ainda exigem testes específicos
- Isolamento entre empresas em todas as rotas e relações.
- Revogação de sessão após bloqueio ou remoção de vínculo.
- Expiração do token e fluxo de reautenticação.
- Concorrência em baixa de estoque, checkout e agenda.
- Regras de cargos e permissões por módulo.
- Integridade financeira e consistência de lançamentos gerados pelo PDV.
- Fluxos de feed, comentários, reações, chat e notificações.
- Tratamento de erros de rede e seleção de empresa para usuários com múltiplos vínculos.

## Estado honesto
As alterações desta etapa foram gravadas no repositório. A execução de GitHub Actions não foi confirmada nesta sessão; portanto, builds, migrations e testes continuam **pendentes de validação**.
