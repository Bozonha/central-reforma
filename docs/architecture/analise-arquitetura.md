# Central de Reforma — Análise Crítica e Proposta Técnica (Pré-Implementação)

Documento preparado a partir da leitura integral de `Central_de_Reforma_Escopo_Mestre_para_Claude.md` (v1.0), seguindo a seção 56 (prompt de inicialização). Nenhuma linha de código foi escrita nesta etapa — este é o produto da análise arquitetural solicitada.

---

## 1. Sumário executivo

O escopo mestre é sólido em princípios (integridade de dados, separação determinístico/IA, economia de contexto, modularidade por fases) mas assume, em vários pontos, que capacidades ainda não existem — principalmente a coleta automatizada de dados de mercado (preços, estoque, lojas) — como se já fossem infraestrutura disponível. O maior risco do projeto não é técnico-arquitetural, é de **disponibilidade de dados reais**: o "Market Engine" é o coração do produto (comparador, histórico de preços, alertas), mas depende de fontes que precisam ser negociadas, raspadas ou inseridas manualmente, e isso tem implicações legais, de custo e de cronograma que o documento não resolve.

Recomendação central: começar com uma **fundação simples (MVP 0)** — obras, ambientes, orçamento, dashboard, sem IA e sem mercado — validar a experiência de uso real, e só então decidir, com dados concretos, como o Market Engine será alimentado no MVP 1. Isso é consistente com a própria filosofia do documento ("não construir tudo de uma vez") e reduz o risco de construir uma pipeline de dados cara antes de validar se o produto resolve o problema certo.

---

## 2. Conflitos e ambiguidades identificados

**2.1 "Obra" vs. "Projeto".** A seção 5 diz que o usuário pode criar "uma obra completa ou apenas um projeto específico" (ex.: "Reforma do banheiro"), mas a seção 6 lista "Obras/Projetos" como um único nó na árvore, e o restante do documento usa "projeto" livremente como sinônimo de obra e, em outros trechos, como sinônimo de ambiente/etapa. Isso precisa ser resolvido antes do modelo de dados: a recomendação é que **Obra seja a única entidade de topo** (uma reforma de banheiro é uma Obra com um Ambiente só), e "projeto" fique como termo de produto/UX, não como tabela separada.

**2.2 Isolamento estrito de usuário vs. colaboração implícita.** A seção 43 exige que "nenhum usuário deve conseguir consultar a obra de outro usuário" — correto como regra de segurança — mas várias partes do produto (mão de obra, diário da obra com "profissionais presentes", Fase B trazendo pedreiros/arquitetos) sugerem que mais de uma pessoa vai interagir com a mesma obra. O documento não define se isso é colaboração multiusuário (cônjuge, pedreiro com acesso limitado) desde o início ou se, no MVP, cada obra tem exatamente um proprietário e ponto final. Isso muda o modelo de autorização (RBAC por obra vs. dono único) e precisa ser decidido antes do MVP 0, mesmo que a resposta seja "single-owner por agora".

**2.3 "IA não deve dominar a experiência" vs. amplitude das funcionalidades de IA descritas.** Boa parte do escopo (visão computacional, matching de produtos, validação de preços, agentes especializados) é intrinsecamente dependente de IA. Não há conflito de princípio, mas há um risco de execução: se cada tela chamar um agente, a experiência vira um chatbot disfarçado de SaaS. A leitura correta (e a que estou assumindo) é que a IA deve estar **atrás de ações determinísticas da UI** ("Pesquisar material" é um botão, não uma pergunta em chat), com o agente sendo acionado como implementação da ação, não como interface.

**2.4 Pipeline de mercado descrito como se as fontes já existissem.** As seções 14, 15, 16 e 41 descrevem crawler → extractor → normalizer → matcher → validator → price engine como uma arquitetura pronta para qualquer loja. Na prática, cada varejista tem termos de uso próprios, muitos proíbem scraping, APIs públicas de preço são raras no varejo de materiais de construção no Brasil, e não há nenhuma fonte de dados confirmada no documento. Isto é o requisito ausente mais crítico do projeto (ver seção 3).

**2.5 Classificação de histórico de preços (verde/amarelo/vermelho/cinza) sem definição estatística.** A seção 17 define as categorias mas não os limiares (que percentil é "muito bom"? quantas observações são "suficientes"?). Isso precisa ser especificado como regra determinística antes de codificar — não pode ser deixado para o LLM "decidir na hora", sob pena de violar o próprio princípio da seção 39.

**2.6 "Duplicar estrutura quando apropriado" (seção 9) é vago.** Não está claro se significa duplicar um template de ambientes (ex.: "criar obra a partir de um modelo de reforma de banheiro padrão") ou duplicar uma obra existente do mesmo usuário. São features diferentes; recomendo tratar como um "template de obra" opcional no roadmap de UX, não como requisito de MVP 0.

**2.7 Escopo geográfico/idioma implícito, não declarado.** Preços em R$, medidas em m², nomes de ambientes em português — tudo indica Brasil/pt-BR, mas isso nunca é dito explicitamente como restrição do MVP. Vale declarar isso como decisão (ver seção 8.B) em vez de deixar implícito, porque afeta modelagem de moeda/unidade desde o início.

**2.8 Ação externa autorizada (seção 22, 52) sem modelo de autorização definido.** "Ações externas devem exigir autorização apropriada" e "ações que envolvam dinheiro... devem possuir autorização explícita" são princípios corretos mas não fazem parte do MVP — não há hoje nenhuma ação externa real (comprar de fato em nome do usuário) nem previsão de quando isso entra. Não é um conflito, é algo a manter deliberadamente fora do roadmap até muito mais tarde (Fase D).

---

## 3. Requisitos ausentes

- **Fontes de dados de mercado reais.** Nenhuma API, parceria ou fonte concreta é citada. Sem isso, "Market Engine" é uma arquitetura sem combustível.
- **Colaboração multiusuário por obra** (convidar cônjuge, pedreiro, arquiteto com permissões limitadas) — mencionado implicitamente nas fases B/C, ausente no modelo de dados/autorização do MVP.
- **LGPD e privacidade de dados.** O produto guarda documentos financeiros, fotos de imóveis e dados pessoais. A seção 43 fala em "segurança" genérica, mas não em base legal de tratamento, direito de exportação/exclusão de dados, retenção, nem consentimento para uso de IA sobre documentos/fotos do usuário.
- **Canal de notificação para alertas** (seção 18/22) — e-mail, push, in-app? Não definido, mas é dependência técnica direta (provedor de e-mail transacional, ou nada).
- **Modelo de monetização** — não precisa ser resolvido agora, mas sua ausência tem que ser uma decisão consciente (ver 8.B), pois afeta se o MVP já precisa de limites de uso.
- **Ambiente de dev/staging/produção e pipeline de CI/CD** — não mencionado, necessário desde o MVP 0.
- **Observabilidade** (error tracking, métricas, logs estruturados) — "logs; auditoria" é citado em segurança, mas sem ferramenta/abordagem.
- **Estratégia de custo de IA em runtime** — quantas chamadas de LLM por usuário/dia, cache de respostas, orçamento de tokens por conta. O documento fala de economia de tokens em tempo de desenvolvimento (Claude Code), mas não em tempo de execução do produto (custo variável por usuário ativo).
- **Backoffice/ferramenta interna** para revisar matches de produto ambíguos, corrigir dados de IA, investigar denúncias — necessário a partir do MVP 1/4 quando houver matching automático.
- **Critérios de aceite por etapa do roadmap** — o documento lista o que cada MVP contém, mas não como saber que está "pronto". Proponho isso na seção 9.

---

## 4. Arquitetura proposta

Modular, e deliberadamente **não microsserviços** no início — o princípio de simplicidade do próprio documento (seção 39/54) pede isso. Um monorepo com quatro camadas lógicas:

1. **Web (apps/web)** — Next.js/React. Interface SaaS, dashboard, módulos tradicionais + área "de que você precisa".
2. **Domínio (packages/domain)** — TypeScript puro, sem dependência de framework. Todo cálculo determinístico vive aqui: área, argamassa, rejunte, orçamento, motor de logística, estatística de histórico de preços, recálculo de cronograma. 100% testável sem banco ou rede.
3. **Dados (packages/database)** — schema/migrations Postgres, acesso a dados.
4. **Inteligência/Agentes** — camada de orquestração de IA (Anthropic API), acionada por ações específicas da UI, nunca como interface primária.

**Decisão a validar com você:** o documento já propõe `apps/api` separado de `apps/web` desde o início. Isso é uma opção válida (facilita expor API para parceiros/mobile nas Fases B-D), mas tem custo de complexidade agora sem benefício imediato no MVP 0-2. Recomendo **adiar `apps/api` como serviço separado** e usar Route Handlers/Server Actions do Next.js como camada de API no início, mantendo `packages/domain` isolado de framework — assim, extrair um serviço de API dedicado depois é uma refatoração de baixo custo, não uma reescrita. Ver decisão B.1 na seção 9.

Isolamento entre obras de usuários diferentes (seção 43) é reforçado em duas camadas: verificação na aplicação (toda query filtrada por `user_id`) **e** Row-Level Security no Postgres como defesa em profundidade — para que um bug de aplicação não vaze dados entre contas.

Histórico de preços (seções 17/42) é modelado como tabela **append-only** de observações (`price_observation`), separada da tabela mutável de "oferta atual" (`offer`) — assim nunca se perde uma observação para recalcular histórico depois, e o dado histórico nunca é sobrescrito.

---

## 5. Stack proposta (validada, não assumida)

O documento sugere React/Next.js + TypeScript + PostgreSQL "mas não assumir sem validar". Minha validação:

| Camada | Proposta | Por quê | Alternativa considerada |
|---|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui | Ecossistema maduro, server components ajudam performance, shadcn dá aparência "SaaS profissional" sem esforço de design system do zero | Remix (válido, ecossistema menor) |
| Backend | TypeScript (via Next.js no início) | Uma linguagem só entre front/back reduz custo cognitivo para equipe pequena e permite compartilhar tipos com `packages/domain` | Python (melhor para ML próprio, mas visão/OCR podem ser resolvidos via API externa — não força troca de stack agora) |
| Banco de dados | PostgreSQL | Suporta bem orçamento/estoque/preços com integridade relacional; JSONB cobre "campos extensíveis" (seção 9) sem precisar de schema flexível tipo NoSQL; full-text search nativo (pg_trgm/tsvector) é suficiente para MVP 1 antes de precisar de Elasticsearch/Meilisearch | MongoDB (perde garantias relacionais que orçamento/estoque exigem) |
| ORM | Prisma | Tooling de migração maduro, boa curva de aprendizado | Drizzle (mais leve, mais próximo de SQL — reavaliar se Prisma virar gargalo) |
| Auth | Auth.js (self-hosted) **ou** Clerk — decisão B.2 | Auth.js evita dependência/custo por usuário; Clerk é mais rápido de implementar | Supabase Auth (junto com Supabase como BD, ver B.3) |
| Storage de arquivos | S3-compatível (Cloudflare R2 ou AWS S3) | Fotos, PDFs, notas fiscais fora do banco, referenciadas por URL | — |
| Hospedagem | A decidir (B.3) — Vercel/Neon, Supabase, ou self-host | Não vou citar valores de plano/preço específicos aqui: preços de provedores mudam e não devem ser tratados como fato sem verificação atual, seguindo a própria regra de integridade de dados do documento (seção 4) aplicada também a decisões de infraestrutura | — |
| Fila/jobs assíncronos | Nenhuma dedicada no MVP 0-1; cron simples quando necessário (MVP 4-5) | Evita complexidade prematura (Redis/BullMQ) antes de existir pipeline de mercado real | BullMQ + Redis quando o Market Engine assíncrono for aprovado |
| IA/LLM | Anthropic Claude via API (Messages API), incluindo visão para fotos/documentos | Evita subir modelos próprios de CV; a saída da visão deve sempre ser rotulada CONFIRMADO/ESTIMADO/PROVÁVEL/DESCONHECIDO conforme seção 26 | OCR especializado (AWS Textract/Google Document AI) como opção futura para notas fiscais brasileiras, se a precisão do Claude não for suficiente — não decidir agora, medir depois |
| Testes | Vitest (unit/domínio) + Playwright (E2E) | Cálculos determinísticos exigem cobertura alta; Playwright reaproveita o mesmo conhecimento do MCP sugerido no documento | — |
| Monorepo | Turborepo | Leve, integra bem com a estrutura de pastas já proposta no documento | Nx (mais pesado do que necessário aqui) |

---

## 6. Modelo de dados inicial (MVP 0–2)

Todas as entidades que carregam dado externo/incerto reutilizam um objeto de **proveniência** comum (fonte, URL, capturado_em, verificado_em, confiança, condições) — implementação direta da regra de integridade da seção 4, para não repetir esses campos ad-hoc em cada tabela.

- **Usuario** — id, email, nome, criado_em.
- **Obra** — id, usuario_id (dono), nome, tipo (casa/apartamento/ambiente único), status (ativa/arquivada), orçamento_total, data_inicio, data_fim_prevista, observações, campos_extras (JSONB).
- **Ambiente** — id, obra_id, nome (banheiro/cozinha/...), dimensões (largura, comprimento, altura — cada uma com `fonte_medida`: USUARIO | DOCUMENTO | VISAO_ESTIMADA | CONFIRMADA | DESCONHECIDA), área calculada (derivada, nunca digitada), campos_extras.
- **Produto** — id, nome, fabricante, marca, modelo, sku, ean_gtin, categoria, unidade, quantidade_embalagem, especificações (JSONB).
- **Loja/Seller** — id, nome, tipo (marketplace/loja própria/física), região.
- **Oferta** — id, produto_id, seller_id, preço, unidade, quantidade_embalagem, frete, retirada_disponível, estoque_status, proveniência (fonte/url/capturado_em/confiança).
- **PriceObservation** (append-only) — id, produto_id, seller_id, preço, unidade, capturado_em, proveniência — nunca atualizado, só inserido.
- **ItemListaCompras** — id, obra_id, ambiente_id, produto_id (opcional se ainda não resolvido), quantidade_necessária, quantidade_comprada, quantidade_em_estoque, prioridade, etapa, status.
- **Compra** — id, obra_id, produto_id, quantidade, preço_pago, loja, data, forma_pagamento, nota_fiscal_documento_id, status, entrega/retirada.
- **ItemEstoque** — id, obra_id, ambiente_id (opcional), produto_id, quantidade, unidade, origem (manual/nota_fiscal/foto), documento_id (opcional).
- **LinhaOrcamento** — id, obra_id, ambiente_id (opcional), categoria, planejado, comprado, pago.
- **Tarefa** — id, obra_id, ambiente_id, título, responsável, início, fim, duração, status, dependências (array de tarefa_id), prioridade, percentual_conclusão.
- **Documento** — id, obra_id, tipo (orçamento/contrato/nota/recibo/garantia/planta/outro), arquivo_url, classificação, extraído_por (manual/OCR/IA), data_upload.
- **DiarioEntrada** — id, obra_id, data, texto, fotos (array de foto_id), tarefas_executadas, problemas, decisões.
- **Foto** — id, obra_id, ambiente_id (opcional), url, tipo (antes/depois/progresso), análise_ia (opcional, com rótulo de confiança).
- **Problema** — id, obra_id, ambiente_id (opcional), descrição, status, data.
- **Decisao** — id, obra_id, descrição, data, contexto.
- **Alerta** — id, usuario_id, produto_id, condição (ex.: preço_abaixo_de), ativo, última_verificação.

Todas as tabelas com `obra_id` levam Row-Level Security por `usuario_id` (via join ou coluna denormalizada, a definir na implementação).

---

## 7. Estrutura de repositório

```
central-reforma/
├─ CLAUDE.md
├─ .claude/
│  ├─ agents/
│  ├─ skills/
│  ├─ hooks/
│  └─ settings.json
├─ apps/
│  └─ web/                 (Next.js — API via Route Handlers/Server Actions no início)
├─ packages/
│  ├─ database/            (schema Prisma + migrations)
│  ├─ domain/               (regras de negócio e cálculos determinísticos, sem dependência de framework)
│  ├─ ui/                   (design system compartilhado)
│  └─ shared/                (tipos, constantes, utilitários)
├─ docs/
│  ├─ architecture/
│  ├─ product/
│  ├─ data/
│  └─ agents/
└─ (apps/api entra aqui somente quando a Fase B justificar consumidores externos)
```

---

## 8. Agentes, subagentes, skills, MCPs, plugins e hooks

**8.1 Ativação incremental de agentes** (a lista do documento na seção 31 está correta como catálogo, mas não deve ser toda ativada de início — seguindo a própria seção 31):

- **MVP 0** — nenhum agente. Só CRUD determinístico + dashboard.
- **MVP 1** — `orchestrator` (fino, para ações como "pesquisar material"), `market-research`, `product-matching`, `price-validation`. Este é o núcleo real do Market Engine.
- **MVP 2** — a maior parte é código determinístico (orçamento, estoque). Um agente leve de "assistente de compra" apenas para interpretar OCR de nota fiscal em `Compra`/`ItemEstoque` estruturado, sempre pedindo confirmação humana quando houver ambiguidade (regra da seção 21).
- **MVP 3** — recálculo de cronograma é código determinístico (seção 23), não agente. `construction` como agente opcional para interpretar entradas de diário/problemas.
- **MVP 4** — `vision`, `document`, `price-history` (estatística é código; a interpretação/explicação é agente), `labor`, `alert`.
- **`orchestrator`** ganha papel real de coordenação só quando houver múltiplos agentes a combinar (exemplo da seção 32 — comprar porcelanato), então entra plenamente no MVP 1/2.

**8.2 Skills** (conhecimento reutilizável, carregado só quando relevante): `data-integrity` (base, qualquer agente que toque dado externo carrega), `product-research`, `product-matching`, `price-validation`, `price-history`, `logistics-calculation`, `construction-calculation`, `document-analysis`, `vision-analysis`, `frontend-design` (uso em tempo de desenvolvimento, não em produção), `testing`, `security`. Acrescento duas ao catálogo do documento: **`pt-br-locale`** (regras de formatação de moeda/unidade/data consistentes) e **`lgpd-compliance`** (regras de tratamento de dado pessoal, já que o produto guarda documentos financeiros e fotos de imóveis).

**8.3 MCPs.** Validando a lista do documento: Context7 (documentação de bibliotecas) e Git/GitHub — úteis em tempo de desenvolvimento com Claude Code, sem ressalva. Playwright — útil para testes E2E; **como ferramenta de pesquisa de mercado em produção é diferente e mais sensível**: usar Playwright para automatizar coleta de preços de varejistas terceiros pode violar termos de uso desses sites, e isso é uma decisão de risco/legal, não só técnica (ver decisão B.4). Banco de dados via MCP — só recomendo em ambiente de leitura/staging para depuração assistida por Claude Code, nunca acesso de escrita a produção por essa via. Não recomendo adicionar MCPs de scraping ou "dados de mercado" especulativamente: a pipeline da seção 41 (crawler → extractor → normalizer → matcher → validator → price engine → banco) é infraestrutura de aplicação (workers/jobs), não uma cadeia de chamadas MCP em tempo de execução — MCP aqui serve ao Claude Code durante o desenvolvimento, não ao produto em produção.

**8.4 Plugins.** `commit-commands` e `security-guidance` desde o MVP 0 (fundação de segurança/autenticação está sendo construída já). `frontend-design` a partir do momento em que a UI ganha corpo (final do MVP 0). `pr-review-toolkit` quando houver mais de uma pessoa contribuindo. Não instalar todos de uma vez.

**8.5 Hooks** (mínimos, por princípio da seção 37): pre-commit para lint/typecheck/testes; bloqueio de commit de secrets; e um hook que exige teste acompanhando qualquer alteração em `packages/domain` (reforça a regra "cálculo determinístico é testado", seção 49).

---

## 9. Segurança e LGPD

Autenticação via Auth.js ou Clerk (decisão B.2); autorização checada na aplicação **e** reforçada com Row-Level Security no Postgres por `usuario_id`; validação de entrada com Zod em toda borda de API; upload de arquivo com allowlist de mime-type, limite de tamanho e verificação antes de armazenar; segredos apenas em variáveis de ambiente/gerenciador de secrets, nunca em commit (hook dedicado); rate limiting em endpoints públicos e, especialmente, em endpoints que disparam chamadas de IA (controle de custo e abuso); tabela de auditoria para ações sensíveis (exclusão de obra, alteração financeira). Para LGPD: telas de consentimento explícito para uso de IA sobre documentos/fotos enviados, endpoint de exportação e exclusão de dados do usuário, e retenção mínima necessária de dados sensíveis (notas fiscais, comprovantes).

---

## 10. Testes

Cobertura alta e obrigatória para `packages/domain` (área, argamassa, orçamento, logística, estatística de histórico) — são funções puras com impacto financeiro direto. Testes de integração específicos para isolamento entre usuários (uma obra do usuário A nunca deve aparecer para o usuário B) — isso é teste de segurança, não só de funcionalidade. E2E com Playwright cobrindo o fluxo crítico: criar obra → adicionar ambiente → adicionar item à lista de compras → registrar compra → ver dashboard atualizado. Testes de contrato com fixtures gravadas para qualquer adaptador de fonte externa de mercado — se a fixture estiver desatualizada ou ausente, o teste deve falhar, nunca inventar uma resposta (aplicação da regra da seção 4 também em teste).

---

## 11. Estratégia de contexto e economia de tokens

Implementar como padrão de código, não como convenção informal: uma função em `packages/domain` (ex.: `getObraContext(obraId, { scope: 'ambiente', ambienteId })`) que devolve um payload tipado e limitado em tamanho — só a obra, o ambiente, os materiais e o histórico relevantes àquela pergunta, nunca o banco inteiro. Todo agente consome contexto por essa função, nunca por query livre direto no banco. Isso torna a regra da seção 40 verificável em código review, não apenas uma diretriz de prompt.

---

## 12. Roadmap técnico

**MVP 0 — Fundação**, fatiado em unidades pequenas e verificáveis (cada uma: implementar → testar → revisar → simplificar → documentar → commit):

1. Scaffold do monorepo (lint, typecheck, CI básico).
2. `packages/database`: schema inicial (Usuario, Obra, Ambiente) + migrations.
3. Autenticação (cadastro/login/sessão) + Row-Level Security + testes de isolamento entre usuários.
4. CRUD de Obra (criar/editar/arquivar/excluir).
5. CRUD de Ambiente vinculado à Obra.
6. Dashboard básico (somente leitura do que já existe — orçamento/mercado entram depois, nos MVPs seguintes).
7. Casca de navegação responsiva (menus tradicionais + placeholder da área "de que você precisa").
8. Deploy em staging + observabilidade mínima (rastreamento de erros).

Critério de aceite do MVP 0: um usuário consegue criar conta, criar uma obra com ao menos um ambiente, ver isso no dashboard, e um segundo usuário não consegue, de forma alguma, acessar a obra do primeiro.

**MVP 1 — Mercado.** Antes de fatiar em tarefas, é **obrigatório resolver a decisão B.4** (quais fontes de dados são realmente utilizáveis) — caso contrário o MVP 1 é construído sobre uma suposição não validada. Uma vez resolvido, o núcleo é: cadastro manual de produto/oferta pelo usuário (sempre disponível, nunca depende de terceiros) + qualquer fonte automatizada aprovada como complemento, não como base.

**MVP 2 — Compras** (lista de compras, orçamento, compras, estoque, notas): majoritariamente código determinístico; a única peça de IA é a leitura assistida de nota fiscal/recibo, sempre com confirmação humana antes de gravar valor.

**MVP 3 — Gestão** (cronograma, Gantt, diário, mão de obra): recálculo de cronograma é determinístico; mão de obra herda a mesma regra de "nunca inventar profissional" — sem fonte confiável de dados de profissionais, esse módulo fica limitado a cadastro manual pelo próprio usuário no início.

**MVP 4 — Inteligência** (recomendações, visão, documentos, agentes, alertas, histórico): só faz sentido com volume real de dados dos MVPs anteriores; caso contrário as recomendações não têm base.

**MVP 5 — Automação**: mantido fora de escopo até haver uma base de usuários e dados reais que justifiquem o investimento em monitoramento contínuo e ações assistidas de compra.

---

## 13. Decisões que posso tomar automaticamente (A)

Estrutura interna do monorepo; escolha de ORM (Prisma) e ferramenta de testes (Vitest/Playwright); convenções de nomenclatura de tabelas/colunas; uso de Zod para validação; organização de pastas dentro de `packages/`; formatação/lint (ESLint/Prettier). São decisões reversíveis e sem impacto de produto ou custo.

## 14. Decisões que precisam da sua aprovação (B)

- **B.1** — API separada (`apps/api`) desde já vs. Next.js full-stack no início (recomendo adiar a separação).
- **B.2** — Provedor de autenticação: Auth.js self-hosted vs. Clerk/Supabase Auth (custo por usuário vs. controle/sem vendor lock).
- **B.3** — Provedor de hospedagem e banco de dados (Vercel+Neon, Supabase, self-host) — decisão de custo/operação que não devo assumir nem estimar em valores, já que preços de provedores mudam e não são dados que eu deva "inventar" ou tratar como fixos.
- **B.4** — **A mais importante**: quais fontes de dados de mercado o MVP 1 vai realmente usar (só cadastro manual do usuário? scraping de quais lojas, com qual avaliação legal? parceria/afiliados?). Sem isso definido, o Market Engine não pode ser dimensionado.
- **B.5** — Colaboração multiusuário por obra desde o MVP 0, ou dono único por agora.
- **B.6** — Escopo geográfico/idioma fixo em Brasil/pt-BR/BRL para o MVP, ou já abstrair moeda/unidade (custo extra agora por flexibilidade futura).
- **B.7** — Uso de Claude (visão) para OCR de nota fiscal vs. serviço especializado (Textract/Document AI) — pode ser decidido por teste empírico de precisão antes do MVP 2, não precisa de decisão agora.
- **B.8** — Modelo de monetização (mesmo que "nenhum por enquanto") — para saber se já preciso desenhar limites de uso.

## 15. Riscos (C)

Legalidade/estabilidade de coleta automatizada de preços em sites de terceiros (ToS, bloqueio de IP, dados desatualizados); erro de OCR/visão gerando decisão financeira ruim se a confirmação humana não for respeitada rigorosamente; custo de chamadas de IA crescendo de forma não controlada com a base de usuários sem cache/limite; histórico de preços ficando "cinza" (dados insuficientes) por muito tempo se não houver fonte automatizada suficiente; escopo do documento mestre (57 seções, visão até Fase D) tentar avançar rápido demais antes de validar que o MVP 0/1 resolve o problema real do usuário.

## 16. Dependências (D)

Escolha de provedor de hospedagem/BD e de autenticação (B.2/B.3); disponibilidade e limites de uso da API Anthropic; resolução da decisão de fontes de mercado (B.4), que pode depender de negociação externa fora do controle técnico; eventual serviço de OCR dedicado se Claude não for suficiente (B.7).

## 17. Custo/complexidade potencial (E) — qualitativo

MVP 0 é baixo custo e baixa complexidade: tecnologia madura, sem dependência externa incerta. MVP 1 concentra a complexidade real do projeto — não no código da aplicação, mas na obtenção e manutenção de dados de mercado confiáveis, o que pode consumir mais tempo do que qualquer outra parte do roadmap se a decisão B.4 apontar para scraping próprio. MVP 4 introduz custo operacional variável (chamadas de LLM proporcionais ao uso), que deve ser mitigado com cache de respostas e limites por conta desde o desenho.

---

## 18. Próximo passo

Este documento não implementa nada. Ele espera sua decisão sobre os pontos da seção 14 (B.1 a B.8) — em especial B.4, que é a que mais afeta o cronograma real. Depois disso, o plano de implementação por etapas da seção 12 (começando pelo MVP 0, item 1) pode ser executado em unidades pequenas e verificáveis, como pede a metodologia da seção 45 do documento mestre.
