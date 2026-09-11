# Central de Reforma — regras persistentes

Leia isto antes de qualquer mudança. Ele existe para que você não precise reconstruir decisões já tomadas — a análise completa está em `docs/`, mas o que importa no dia a dia está resumido aqui.

## O produto, em uma frase

"Sistema Operacional da Reforma": ajuda uma pessoa a planejar, pesquisar, comprar, organizar e acompanhar uma reforma. É um SaaS profissional, não um chatbot — a IA aparece quando é útil, nunca domina a tela.

## Regras não-negociáveis (violá-las é bug, não é estilo)

1. **Nunca inventar dado externo.** Preço, produto, loja, fornecedor, profissional, avaliação, prazo, disponibilidade — se não há fonte verificável, a resposta é "informação não disponível", nunca uma estimativa disfarçada de fato.
2. **Todo dado externo carrega proveniência**: fonte, URL/identificador, data/hora de coleta, status de verificação, confiança. Sem isso, o dado não entra no sistema.
3. **Cálculo determinístico é código, não é IA.** Área, argamassa, orçamento, custo de logística, estatística de histórico de preço, recálculo de cronograma — tudo isso vive em `packages/domain` como função pura testável. Um LLM nunca faz soma, média, mediana ou data.
4. **Medidas têm proveniência tipada**: `USUARIO | DOCUMENTO | VISAO_ESTIMADA | CONFIRMADA | DESCONHECIDA`. Uma estimativa de visão computacional nunca é apresentada como medida confirmada.
5. **Scraping nunca é "melhor esforço".** Um scraper só existe depois de uma checklist de conformidade aprovada por uma pessoa (robots.txt + Termos de Uso revisados, taxa de requisição definida, identificação honesta do bot) — ver `docs/agents/market-engine-spike/compliant-source-harness.ts` para o padrão de código que torna isso obrigatório, não opcional.
6. **Isolamento entre usuários é absoluto.** Ninguém acessa uma Obra da qual não é `ObraColaborador` — nem por bug de aplicação (checar sempre) nem por falha de configuração (por isso RLS no Postgres como segunda camada, não só checagem na aplicação).
7. **Contexto é escopado, nunca é "o banco inteiro".** Uma pergunta sobre o banheiro carrega a obra, o banheiro, os materiais e o histórico daquele ambiente — nunca a obra inteira ou o catálogo inteiro sem necessidade.
8. **Nunca construir tudo de uma vez.** Cada mudança é uma unidade pequena e verificável: implementar → testar → revisar → simplificar → documentar → commit. Ver `docs/product/roadmap.md` para a fatia atual.

## Decisões já fechadas — não reabra sem motivo novo

Resumo (detalhe completo em `docs/product/decisoes.md` e `docs/product/decisao-fontes-de-mercado.md`):

- Next.js full-stack (Route Handlers/Server Actions) — sem `apps/api` separado por enquanto.
- **Autenticação: JWT + bcrypt self-hosted (não Auth.js), substituição documentada de B.2.** `jose` (assinatura/verificação de JWT) + `bcryptjs` (hash de senha), sessão em cookie `cr_session` httpOnly assinado (30 dias), lida em `middleware.ts` sem tocar `next/headers`/DB (Edge-safe). Motivo: não foi possível validar compatibilidade do Auth.js/next-auth com Next 16 + React 19 neste ambiente — a substituição preserva a intenção original (self-hosted, sem vendor lock, sem custo por usuário). Se alguém quiser migrar para Auth.js depois, é troca isolada em `lib/auth/*`, o resto do app não depende da biblioteca específica.
- **Hospedagem/BD: Vercel + Neon — CONFIRMADO E EM PRODUÇÃO** (B.3 resolvida). Projeto Neon "Central reforma" (`sweet-dream-97214717`, região `aws-sa-east-1`, Postgres 18). Connection string em `DATABASE_URL` (pooler `-pooler.sa-east-1.aws.neon.tech`).
- Colaboração por Obra desde o MVP 0 (`ObraColaborador`: DONO/COLABORADOR/VISUALIZADOR) — `Obra` não tem coluna de dono.
- Escopo fixo: Brasil / pt-BR / BRL.
- Sem monetização por enquanto, mas com teto de chamadas de IA por conta/dia desde o desenho (ainda não implementado — não há chamada de IA em runtime ainda).
- Mercado (MVP 1): **cadastro manual real (produtos/lojas/ofertas) já implementado e em uso.** Integração Mercado Livre via API oficial deixada pronta para plugar depois (decisão explícita do dono do produto), sem mudar o catálogo já construído. Scraping de grandes redes só caso a caso.
- Lojas locais: descoberta real via OpenStreetMap/Overpass (implementada, `lib/mercado/overpass.ts`) + geocodificação via Nominatim (`lib/mercado/nominatim.ts`). Distância/rota: por enquanto só linha reta (`haversineDistanceKm` em `packages/domain/src/logistics.ts`) — OSRM auto-hospedado (B.10) ainda não implantado, é próxima etapa se rota real virar necessidade.

### ORM: Drizzle, não Prisma (mudança de B.1-adjacente, não documentada antes)

O schema original foi desenhado em Prisma 7. Prisma 7 CLI (`generate`/`migrate`) precisa baixar um binário auxiliar de `binaries.prisma.sh` — bloqueado por política de rede em alguns ambientes de desenvolvimento (confirmado: 403 sem chance de retry). Reescrito para **Drizzle ORM + `@neondatabase/serverless`** (driver `neon-http`, HTTP puro, sem binário nativo, sem conexão TCP crua — funciona em qualquer ambiente com HTTPS de saída, inclusive Edge). Esquema completo (20 tabelas) vive em `packages/database/src/schema.ts`; migrations SQL geradas em `packages/database/migrations/`. Se o ambiente onde você está rodando tiver acesso de rede normal ao domínio do Prisma, **não é motivo para voltar a trocar o ORM** — Drizzle já é a base de todo o app, trocar de volta seria reescrever tudo sem ganho real.

**Importante para qualquer sessão futura:** o driver `@neondatabase/serverless` faz suas próprias chamadas HTTPS para `api.<região>.aws.neon.tech` (a API HTTP da Neon, diferente do host do pooler usado na connection string). Em sandboxes com allowlist de rede restrita, esse host pode estar bloqueado mesmo que o app rode normalmente em produção (Vercel tem rede irrestrita). Se `npm run dev`/`next start` local falhar com erro tipo `NeonDbError ... Host not in allowlist`, isso é o ambiente de desenvolvimento, não um bug no código — aplicar schema/queries de teste via `mcp__Neon__run_sql` / `run_sql_transaction` (MCP, contorna a restrição) em vez de tentar consertar o driver.

## Estrutura

```
apps/web          — Next.js (UI + API). Único app, 9 módulos: Dashboard, Obras, Ambientes,
                     Orçamento, Compras (+ Mercado/preços + mapa de lojas), Estoque,
                     Cronograma, Documentos, Diário. Todos com CRUD real contra o Neon.
packages/database  — schema Drizzle (pg-core) + client (neon-http). Ver README do pacote.
packages/domain    — regras determinísticas puras: dinheiro (centavos), área, histórico de
                     preço (classificação verde/amarelo/vermelho/cinza), orçamento, logística
                     (distância/custo efetivo). Testável e sem dependência de framework.
packages/ui        — design system compartilhado (ainda não criado — Tailwind + tokens CSS
                     em apps/web/app/globals.css cobre o que é preciso até aqui).
packages/shared    — tipos/utilitários compartilhados (ainda não criado).
docs/              — toda a análise que fundamenta este repositório. Leia docs/product/roadmap.md primeiro.
```

## Agentes, skills, MCPs, plugins — ativação incremental, não por padrão

O MVP 0 (fundação: CRUD, auth, dashboard) **não precisa de nenhum agente de IA** — é código determinístico. Não crie agentes em `.claude/agents/` especulativamente. Veja `.claude/agents/README.md` para o plano de quando cada agente entra (Mercado no MVP 1, Inteligência no MVP 4). O mesmo vale para skills: `.claude/skills/data-integrity/` já existe porque é a regra base que qualquer agente futuro vai carregar — não adicione outras skills antes de haver um agente que precise delas.

MCPs recomendados durante o desenvolvimento (não em runtime do produto): Context7 (documentação de bibliotecas atualizadas — útil dado que este projeto já foi pego de surpresa uma vez por uma mudança de major version não documentada no seu treinamento, ver nota abaixo) e Git/GitHub. Não adicione MCPs de scraping/dados de mercado — a pipeline de mercado é infraestrutura de aplicação, não uma cadeia de chamadas MCP.

## Nota sobre versões — leia antes de assumir como algo funciona

Este projeto usa **Next.js 16 e React 19** — mudanças de breaking change relevantes que podem não bater com o que você "sabe" de treinamento (o `create-next-app` já avisa isso em `apps/web/AGENTS.md`). Exemplos reais encontrados ao montar este scaffold:

- Next.js 16 exige rodar `next typegen` (ou `next dev`/`next build`) antes de `tsc --noEmit` funcionar, porque tipos como `LayoutProps<"/rota">` são gerados, não ambientes fixos.
- `next build` no Next 16 recusa `ssr: false` passado a `next/dynamic` diretamente dentro de um Server Component — precisa isolar isso num Client Component wrapper (ver `apps/web/app/(app)/compras/components/lojas-map-client.tsx` para o padrão usado com o mapa Leaflet).
- O `tsconfig.base.json` tem `noUncheckedIndexedAccess` ligado (bom, mas pega gente desprevenida): `array[i]` e `const [x] = await db.insert(...).returning()` são tipados como possivelmente `undefined` — sempre trate antes de usar, não dê `as` para calar o compilador.

Se algo parecer não bater com a documentação que você conhece, **verifique a versão instalada antes de "corrigir" o código** — é provável que o código já esteja certo para esta versão específica.

## Metodologia de commit

Commits pequenos, um por unidade lógica, mensagem no formato `tipo(escopo): o que mudou`. Nunca reescrever grandes partes do código sem necessidade real.
