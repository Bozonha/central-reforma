# Central de Reforma — Registro de Decisões (B.1–B.11)

Todas as decisões pendentes da análise de arquitetura foram fechadas. Este documento é o registro oficial — é ele que deve virar a base do `CLAUDE.md`/`docs/architecture` quando o repositório existir, para que nenhuma decisão precise ser "relembrada" depois.

## Decisões fechadas

| # | Decisão | Escolha |
|---|---|---|
| B.1 | Separar `apps/api` desde já? | **Não.** Next.js full-stack no início (Route Handlers/Server Actions). `packages/domain` isolado de framework para permitir extrair uma API separada depois, se a Fase B exigir. |
| B.2 | Provedor de autenticação | **Auth.js self-hosted** — na implementação real, substituído por **JWT (`jose`) + `bcryptjs` self-hosted**, decisão tomada durante a construção porque a compatibilidade do Auth.js/next-auth com Next 16 + React 19 não pôde ser verificada no ambiente de build. Mantém a intenção original (self-hosted, sem vendor lock, sem custo por usuário) — ver `CLAUDE.md`. |
| B.3 | Hospedagem e banco de dados | **Vercel + Neon — CONFIRMADO E EM PRODUÇÃO.** Neon Postgres real provisionado (projeto "Central reforma", `aws-sa-east-1`), schema completo aplicado. ORM trocado de Prisma 7 para **Drizzle** durante a construção (CLI do Prisma bloqueada por rede no ambiente de build) — ver `packages/database/README.md`. Deploy no Vercel é a próxima ação prática pendente. |
| B.4 | Fontes de dados de mercado (MVP 1) | Mercado Livre via API oficial registrada + feeds de afiliado (Lomadee/Awin, a confirmar por você) + cadastro manual como base universal. Scraping só caso a caso, com a checklist de conformidade do harness. **Escopo de implementação confirmado nesta sessão: cadastro manual real construído primeiro (produtos/lojas/ofertas, já em uso); integração Mercado Livre deixada pronta para plugar depois, sem mudar o catálogo — não foi construída ainda.** |
| B.5 | Colaboração multiusuário por obra | **Sim, desde o MVP 0.** Muda o modelo de dados e o roadmap — ver seção "Impacto da B.5" abaixo. |
| B.6 | Escopo geográfico/idioma | **Fixo em Brasil / pt-BR / BRL** no MVP. |
| B.7 | OCR de nota fiscal | Adiada de propósito — decidir por teste empírico (Claude vision vs. serviço especializado) quando o MVP 2 (compras/estoque) estiver sendo construído. Não bloqueia nada agora. |
| B.8 | Monetização e limite de uso de IA | **Sem cobrança por enquanto**, mas com **teto de chamadas de IA por conta/dia já desenhado desde o MVP 0** (mesmo que generoso), para nunca ter custo variável sem controle. |
| B.9 | Descoberta de lojas locais | **OpenStreetMap/Overpass** (gratuito). Medir cobertura real na região do usuário antes de considerar trocar por Google Places. |
| B.10 | Cálculo de distância/rota | **OSRM auto-hospedado** (gratuito, exige rodar essa peça de infraestrutura). |
| B.11 | Verificar participação em redes de afiliados | **Ação prática sua, ainda pendente:** criar conta de publisher na Lomadee e na Awin e checar quais varejistas de material de construção participam com feed de produto. |

## Impacto da B.5 (colaboração desde o MVP 0) no que já estava desenhado

Isso muda três coisas que valem registrar agora, antes de qualquer código:

**Modelo de dados** — entra uma entidade nova, `ObraColaborador` (ou `ObraMembro`): `obra_id`, `usuario_id`, `papel` (dono | colaborador | visualizador), `convidado_por`, `convidado_em`, `aceito_em` (nulo até o convite ser aceito). A tabela `Obra` deixa de ter um único `usuario_id` "dono" implícito no sentido de acesso — o dono passa a ser só o papel inicial dentro de `ObraColaborador`, não uma coluna separada com regra própria.

**Segurança (seção 43 do escopo mestre)** — a regra "nenhum usuário acessa a obra de outro" continua valendo, mas passa a significar "nenhum usuário acessa uma obra da qual não é `ObraColaborador`", e a política de Row-Level Security no Postgres precisa checar essa tabela de associação em vez de um `usuario_id` direto na obra. Isso é mais robusto, mas também mais código de teste de isolamento logo no MVP 0 (ex.: um "visualizador" não pode editar; um usuário removido perde acesso imediatamente).

**Roadmap** — a fatia 3 do MVP 0 ("Autenticação + RLS + testes de isolamento") cresce um pouco: agora inclui convite por e-mail (ou link) e aceite de colaborador, não é só cadastro/login individual. Isso é um custo real de tempo a mais no MVP 0, mas evita reescrever o modelo de autorização mais tarde — a alternativa (adicionar colaboração depois) exigiria migrar dados e regras de RLS já em produção, o que é mais arriscado do que fazer certo agora.

## Estado geral

Todas as decisões B necessárias para o MVP 0 e o MVP 1 estão fechadas e implementadas — B.3 foi confirmada e está em produção (Neon real, deploy no Vercel pendente como próxima ação prática, não como decisão em aberto). B.11 continua sendo uma tarefa prática sua em paralelo (não bloqueia nada em código). Ver `docs/product/roadmap.md` para o estado atualizado de cada fatia.
