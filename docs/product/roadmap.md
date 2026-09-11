# Roadmap técnico — status

Este arquivo é a fonte de verdade sobre o que já foi feito, para que uma sessão nova (Claude Code ou humano) não precise reconstruir o histórico a partir de conversa. Atualize-o a cada fatia concluída.

## MVP 0 — Fundação → **concluído**, produto passou a MVP 1 real

| # | Fatia | Status | Notas |
|---|---|---|---|
| 1 | Scaffold do monorepo (tooling, lint, CI básico) | **Feito** | npm workspaces + Turborepo. CI ainda não configurado (pendência real, ver abaixo). |
| 2 | `packages/database`: schema completo (20 tabelas, todos os módulos) | **Feito e aplicado** | Reescrito de Prisma 7 para **Drizzle ORM + `@neondatabase/serverless`** (Prisma 7 CLI bloqueada por rede no ambiente de build — ver `packages/database/README.md`). Schema aplicado com sucesso no Neon Postgres real via `mcp__Neon__run_sql_transaction`. |
| 3 | Autenticação + isolamento por obra + colaboração | **Feito** | JWT (`jose`) + `bcryptjs`, self-hosted, substituindo Auth.js (ver `CLAUDE.md`, seção de decisões). `requireObraAccess` em toda query obra-scoped. Convite de colaborador simplificado: só adiciona quem já tem conta (convite assíncrono por e-mail fica para depois). |
| 4 | CRUD de Obra | **Feito** | Criar/editar/arquivar/reativar, colaboradores, endereço com invalidação de geocodificação ao mudar. |
| 5 | CRUD de Ambiente | **Feito** | Dentro da página de Obra + listagem cross-obra em `/ambientes`. |
| 6 | Dashboard com dados reais | **Feito** | Agregação real entre obras: orçamento planejado/pago, tarefas em aberto/atrasadas, compras pendentes, alertas calculados (orçamento estourado por obra via `resumirOrcamento`, tarefas atrasadas), gráfico de orçamento por obra. |
| 7 | Casca de navegação responsiva + tema | **Feito** | Sidebar desktop + drawer mobile, tema claro/escuro via CSS variables + `next-themes`, 9 módulos todos funcionais (não mais placeholder). |
| 8 | Deploy em staging | **Pendente — próxima ação prática** | Ver seção "Deploy" abaixo. |

## MVP 1 — Mercado, compras, cronograma, documentos, diário → **feito**

Todos os 9 módulos de navegação têm CRUD real contra o Neon:

- **Orçamento**: linhas por categoria, gráfico planejado/comprado/pago (recharts).
- **Compras**: lista de compras (com prioridade/etapa/status) + registro de compras efetivadas + catálogo de mercado (produtos/lojas/ofertas, cadastro manual real) + comparador de preços com classificação verde/amarelo/vermelho/cinza (`packages/domain/src/price-history.ts::classificarPreco`) + mapa de lojas próximas (Leaflet + descoberta real via Overpass/OSM + geocodificação via Nominatim).
- **Estoque**: itens com ajuste de quantidade +/-.
- **Cronograma**: tarefas com responsável/prioridade/status/percentual, linha do tempo visual (Gantt simplificado, sem lib externa).
- **Documentos**: upload real de arquivo (salvo em `public/uploads/<obraId>/`, metadados na tabela `documentos`), download, exclusão.
- **Diário**: entradas de texto por data, cronológicas.

Mercado Livre (decisão B.4) **não foi implementado nesta etapa** — o catálogo (produtos/lojas/ofertas) já está pronto para receber essa fonte depois como um adaptador adicional, sem mudar o modelo de dados. Foi uma escolha explícita do dono do produto: cadastro manual real agora, integração ML "pronta para plugar" depois.

## O que foi verificado de fato (não apenas escrito)

- `npm run build --workspace=apps/web` passa **sem nenhum erro de tipo**, todas as rotas geram corretamente (todas as 9 abas + sub-rotas de obra), no ambiente onde isto foi construído.
- Schema aplicado com sucesso no Neon real (confirmado via `mcp__Neon__get_database_tables`).
- **Não verificado de ponta a ponta em runtime dentro do ambiente de build**: o driver `@neondatabase/serverless` faz suas próprias chamadas HTTPS para a API da Neon (host diferente da connection string), que estava bloqueada pela política de rede desse sandbox específico — então cadastro/login/CRUD não puderam ser exercitados clicando na aplicação rodando ali. Isso é uma limitação do ambiente de desenvolvimento, não do código; deve funcionar normalmente assim que publicado (Vercel tem rede irrestrita) ou rodado numa máquina/CI sem essa allowlist.

## Pendências práticas (fora de código)

- **Deploy**: publicar em produção no Vercel. Duas variáveis de ambiente precisam ser configuradas manualmente no painel do Vercel (não há ferramenta automatizada para isso a partir daqui): `DATABASE_URL` (connection string do pooler Neon) e `AUTH_SECRET` (chave de assinatura de sessão), mais `NOMINATIM_USER_AGENT` (recomendado, para a geocodificação de endereço identificar o app educadamente perante o Nominatim).
- **B.11**: verificar no painel da Lomadee e da Awin quais varejistas de material de construção participam com feed de produto (necessário antes de priorizar a integração Mercado Livre/afiliados).
- CI ainda não configurado (GitHub Actions ou equivalente rodando lint/typecheck a cada PR).
- RLS no Postgres (segunda camada de isolamento) ainda não aplicada — checagem de acesso hoje é só em nível de aplicação (`requireObraAccess`), que é a camada obrigatória de qualquer forma; RLS seria defesa em profundidade.
- Distância/rota real até lojas (OSRM auto-hospedado, decisão B.10) ainda não implantada — hoje o mapa usa só distância em linha reta (`haversineDistanceKm`).

## Próxima fatia recomendada

Publicar em produção (Vercel) e testar o fluxo completo (cadastro → criar obra → usar as 9 abas) num ambiente com rede normal, já que isso não pôde ser validado clicando na aplicação dentro do sandbox de desenvolvimento. Depois disso, RLS no Postgres é o próximo item de segurança de verdade a fechar.
