# Provisionamento dos bancos independentes — INFINIX PRO e INFINIX PDV

## Decisão técnica

Candidato gratuito selecionado para avaliação: Neon Free, com um projeto PostgreSQL independente por produto. Não criar dois bancos dentro do mesmo projeto: a separação deve ocorrer no nível de projeto/instância para manter compute, credenciais e ciclo de vida isolados.

- Projeto 1: `infinix-pro` — usado exclusivamente pela API do INFINIX PRO.
- Projeto 2: `infinix-pdv` — usado exclusivamente pela API do INFINIX PDV.
- Nenhum dos projetos pode apontar para o banco do TORCIDA+.
- Não copiar dados, tabelas, roles, migrations ou credenciais de um produto para o outro.

## Limites gratuitos consultados em 15/11/2026

A documentação oficial publicada pela Neon informa para o plano Free: até 100 projetos por organização, 100 CU-horas por projeto/mês, 1 GB de armazenamento por projeto (limite agregado de 20 GB), 5 GB de transferência pública por projeto/mês e suspensão do compute quando a cota de compute ou transferência é esgotada. O compute escala a zero após 5 minutos de inatividade.

Fontes oficiais:
- https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md
- https://neon.com/blog/neon-free-plan-1-gb-per-project

Esses limites permitem tecnicamente manter PRO e PDV em projetos gratuitos distintos, desde que o uso permaneça dentro das cotas. A disponibilidade e os limites devem ser conferidos novamente no momento do provisionamento. Não autorizar upgrade ou cobrança automática.

## Variáveis de ambiente

### Serviço API INFINIX PRO
- `DATABASE_URL`: connection string exclusiva do projeto Neon `infinix-pro`.
- `JWT_SECRET`: segredo exclusivo do PRO.
- `WEB_ORIGIN`: origem do frontend PRO.
- Outras variáveis de integração específicas do PRO, se necessárias.

### Serviço API INFINIX PDV
- `DATABASE_URL`: connection string exclusiva do projeto Neon `infinix-pdv`.
- `JWT_SECRET`: segredo exclusivo do PDV.
- `BOOTSTRAP_ADMIN_KEY`: chave temporária de provisionamento do primeiro proprietário, com pelo menos 32 caracteres.
- `WEB_ORIGIN`: origem do frontend PDV.

Nunca reutilizar o mesmo valor de `DATABASE_URL`, `JWT_SECRET` ou `BOOTSTRAP_ADMIN_KEY` entre os serviços. Nunca inserir secrets em arquivos versionados, commits, issues ou mensagens.

## Ordem de execução

1. Criar dois projetos Neon separados, ambos no plano Free.
2. Guardar cada connection string diretamente nos secrets do respectivo serviço, sem publicá-las no GitHub ou no chat.
3. Extrair o PDV para o repositório próprio antes de configurar o deploy definitivo.
4. Criar schemas Prisma mínimos e independentes; o schema PDV deve conter identidade local (empresa, usuário, associação e papéis) e apenas catálogo, estoque, vendas, trocas, créditos e auditoria do PDV.
5. Executar migrations em cada banco vazio, cada uma pelo pipeline do respectivo repositório.
6. Provisionar o primeiro OWNER do PDV pelo endpoint de bootstrap protegido; não criar credenciais padrão ou previsíveis.
7. Testar login, isolamento entre empresas, estoque, checkout, trocas, créditos e indisponibilidade/retomada do compute.
8. Verificar cotas e configurar alertas/limites disponíveis sem habilitar plano pago.

## Estado

- [x] CI do monorepo validado em PostgreSQL 16 temporário: Prisma validate/generate, migrate deploy, build da API e build web passaram no run 43753082877.
- [x] Limites publicados do Neon Free consultados em 15/11/2026.
- [ ] Repositório independente `INFINIX-PDV` criado.
- [ ] Dois projetos Neon provisionados pelo proprietário.
- [ ] Secrets configurados individualmente nos serviços.
- [ ] Extração, migrations e deploy independentes concluídos.
- [ ] Conta OWNER do PDV criada e login validado.

**Importante:** nenhum banco externo foi criado nesta etapa e nenhuma credencial foi gerada. O login de produção continua indisponível até concluir o provisionamento e o deploy independentes.
