# Central de Reforma — Decisão B.4: Fontes de Dados de Mercado (Market Engine)

Este documento resolve, com dados reais pesquisados hoje, a decisão B.4 do documento anterior (*"quais fontes o MVP 1 vai realmente usar"*) e incorpora um requisito novo: a busca deve cobrir também pequenas lojas locais da região do usuário, com a distância tratada como custo. Nenhum preço, API ou condição comercial abaixo foi inventado — tudo tem fonte. Onde não consegui verificar algo (ex.: acesso de rede indisponível), digo isso explicitamente em vez de estimar.

**Aviso sobre execução:** o ambiente onde este trabalho foi feito não tem saída de rede para os sites pesquisados (bloqueado por política de rede do container) e a ponte com seu computador está indisponível neste momento (erro de montagem no lado do dispositivo, independente de mim). Por isso, o código entregue nesta etapa foi validado por checagem de tipos (`tsc --noEmit`, sem erros), mas **não foi executado contra um site real**. Isso está declarado em cada trecho relevante abaixo — nada é apresentado como "testado" sem ter sido.

---

## 1. Grandes redes e marketplaces — o que existe de fato

| Fonte | Tem API/feed oficial? | Como se consegue acesso | Recomendação |
|---|---|---|---|
| **Leroy Merlin Brasil** | Sim — [Developer's Portal](https://developers.leroymerlin.com.br/) com API de [Products Catalog](https://developers.leroymerlin.com.br/api/51) e API de [Marketplace](https://developers.leroymerlin.com.br/api/61) | Acesso ligado ao [Portal do Fornecedor](https://plataforma.leroymerlin.com.br/) e ao [Portal do Seller](https://portalseller.leroymerlin.com.br/login) — ou seja, é uma API de **parceiro/vendedor do marketplace**, não um cadastro livre de desenvolvedor para consulta de preço. | Não é uma fonte de leitura livre. Só vale se em algum momento fizer sentido negociar uma parceria comercial — não é algo para o MVP 1. |
| **Leroy Merlin — scraping** | — | O `robots.txt` deles (verificado hoje) **desautoriza explicitamente** rastrear páginas de produto (`Disallow: *detalhe-do-produto/-`). | **Não fazer scraping deste site.** Eles deixaram essa intenção clara no próprio robots.txt. |
| **Mercado Livre** | Sim — [portal de developers](https://developers.mercadolivre.com.br/) com [API de busca/itens](https://developers.mercadolivre.com.br/pt_br/itens-e-buscas) e [API de preços](https://developers.mercadolivre.com.br/pt_br/api-de-precos) | Requer registrar uma aplicação (OAuth) no portal — gratuito, mas exige cadastro técnico. Relatos recentes de usuários (Reclame Aqui) mostram erro 403 no endpoint de busca pública sem autenticação — ou seja, hoje é preciso autenticar mesmo para leitura, não é mais totalmente aberto. | **Melhor fonte para MVP 1.** O ML tem enorme cobertura de vendedores de material de construção/ferragens. Recomendo registrar uma aplicação oficial em vez de depender do endpoint público não-autenticado. |
| **Amazon.com.br** | Sim — [Product Advertising API 5.0](https://webservices.amazon.com/paapi5/documentation/) | Exige ser Associado (afiliado) **e ter vendas qualificadas recentes** para obter/manter acesso — é um requisito de "ovo e galinha" para um produto novo sem tráfego ainda. | Não viável como fonte de preço no lançamento do MVP 1. Reavaliar depois que o produto gerar tráfego de afiliado. Nunca fazer scraping da Amazon — os Termos de Uso deles proíbem isso explicitamente e é uma empresa com histórico de ação legal contra scraping. |
| **Lojas em plataforma VTEX** (várias redes brasileiras usam VTEX) | Existe um endpoint público de catálogo (`/api/catalog_system/pub/products/search`) que a própria vitrine da loja usa, sem chave — [descrito em detalhe aqui](https://www.tabnews.com.br/antoniorincon/a-api-publica-de-catalogo-da-vtex-que-quase-ninguem-usa). | Tecnicamente aberto, mas é infraestrutura da VTEX, não uma permissão da loja específica para uso por terceiros. Os Termos de Uso de cada loja continuam valendo por cima disso. | Zona cinzenta: baixo custo técnico, mas **não tratar como integração oficial**. Só usar se, loja por loja, o robots.txt e os Termos de Uso daquela loja específica permitirem, com taxa de requisição conservadora. |
| **Redes de afiliados (Awin, Lomadee, Rakuten)** | Existem e operam no Brasil (Lomadee é focado em pt-BR). Muitos afiliados de e-commerce fornecem feeds de produto (XML/CSV) com preço e estoque — é assim que sites de comparação de preço tradicionalmente funcionam no Brasil. | **Não consegui confirmar, só com busca na web, quais varejistas de material de construção específicos participam** — isso só aparece dentro do painel de cada rede depois de criar conta de afiliado/publisher. | Ação prática para você: criar conta de publisher na Lomadee e na Awin e verificar, no painel, quais varejistas de material de construção participam e oferecem feed de produto. Se Leroy Merlin, C&C, Telhanorte etc. participarem, esse é o caminho **legítimo e sem risco de ToS** para preço/estoque deles — melhor que qualquer scraping. |

**Conclusão da B.4 para grandes redes:** a base do MVP 1 deve ser (1) Mercado Livre via API oficial registrada, (2) o que vier de feeds de afiliado assim que você confirmar participação, e (3) cadastro manual do usuário como fallback universal, sempre disponível. Scraping de grandes redes fica reservado a casos individuais onde o robots.txt/ToS permitir — não é a base do sistema.

---

## 2. Pequenas lojas locais — a peça que você adicionou agora

Isso muda o problema: uma loja de bairro normalmente **não tem site, API, nem feed** — o gargalo aqui nunca foi técnico de scraping, é de descoberta (quais lojas existem perto) e de cadastro (quanto elas cobram).

**Descoberta de lojas próximas** — duas opções reais, com trade-off de custo/qualidade:

- **Google Places API** (Nearby Search/Text Search) — cobertura muito boa de pequenos comércios no Brasil, mas é uma API paga por requisição além de uma cota gratuita (o valor exato muda com frequência; não vou citar número para não tratar como fato — [ver documentação oficial de preços](https://developers.google.com/maps/documentation/places)).
- **OpenStreetMap / Overpass API** — gratuita e aberta, com categorias como `shop=hardware`, `shop=doityourself`, `shop=trade` que cobrem exatamente esse tipo de loja ([Overpass API — OSM Wiki](https://wiki.openstreetmap.org/wiki/Overpass_API)). Limitação real: a cobertura depende de quem já cadastrou aquela loja no OpenStreetMap — pode ser excelente em algumas regiões e pobre em outras, especialmente lojas muito pequenas/informais.

Recomendo **começar pelo OpenStreetMap** (consistente com o princípio de "começar simples e barato" do escopo mestre) e usar o Google Places só se a cobertura do OSM se mostrar insuficiente na prática — isso é uma decisão de custo/qualidade que prefiro te devolver explicitamente (ver decisão B.9 abaixo) em vez de assumir.

**Preço dessas lojas** — na prática, não tem fonte automatizada. O caminho real é o mesmo que o escopo mestre já previa nas seções 21/26: usuário registra manualmente, ou envia foto da etiqueta/nota fiscal (OCR), sempre com a proveniência deixando claro que aquilo é um dado pontual informado pelo usuário, não uma cotação de mercado verificada.

**Distância como custo** — isto é uma extensão direta do "Motor de Logística" que já estava na seção 16 do documento original (custo do produto + frete + combustível + pedágio + estacionamento = custo efetivo). A diferença é que agora isso se aplica também à decisão de "vale a pena ir a essa loja local", não só a frete de e-commerce. Implementei isso como função pura e determinística (sem LLM) no arquivo `distance-cost.ts` entregue junto com este documento: ela calcula o custo efetivo de uma oferta com retirada local (combustível, pedágio, estacionamento, múltiplas viagens se necessário) e decide se aquela oferta é viável comparada a um limite de orçamento — e se faltar um dado (preço do combustível, consumo do carro), ela diz exatamente o que falta, nunca "chuta" um valor. Isso segue à risca a regra da seção 16: "Se algum componente não estiver disponível: 'Não foi possível calcular o custo total porque X não está disponível.'"

Para calcular a distância real (não linha reta), a opção open-source é o **OSRM** (motor de rotas auto-hospedável, sem custo por requisição) — incluí um fallback de distância em linha reta (Haversine) no código para os casos em que nenhuma API de rota estiver configurada, deixado explícito como fallback, nunca disfarçado de distância real.

---

## 3. Arquitetura de adapters — como o código não deixa nada ser inventado

Entreguei dois arquivos TypeScript (validados com `tsc --noEmit`, sem erros de tipo — não executados contra rede real, pelos motivos já explicados):

**`compliant-source-harness.ts`** — define uma interface única (`OfferSource`) para qualquer fonte de oferta, seja API oficial ou scraper. A parte mais importante: um scraper **não consegue ser instanciado** se a checklist de conformidade (`ComplianceRecord`) não estiver completa — robots.txt verificado, Termos de Uso revisados por uma pessoa (não só robots.txt, que é uma coisa diferente de ToS), taxa de requisição conservadora definida, identificação honesta do bot. Se qualquer um desses faltar, o construtor lança erro. Isso transforma a regra "não fazer scraping sem aprovação" em algo que o código impede tecnicamente, não apenas uma orientação que alguém pode esquecer. Deliberadamente **não incluí seletores de HTML para nenhum site específico** — escrever isso sem ter inspecionado a página real seria inventar uma capacidade não verificada, o mesmo erro que a seção 4 do escopo mestre proíbe para preço/produto. Isso precisa ser feito por quem tiver acesso de rede real ao site (seu ambiente de desenvolvimento, quando o repositório existir).

**`distance-cost.ts`** — implementa a descoberta de lojas locais (interface plugável, OSM ou Google Places) e o cálculo determinístico de custo efetivo com deslocamento, descrito na seção 2 acima.

---

## 4. Decisões que precisam da sua aprovação (atualização da lista B)

- **B.4 (resolvida com esta pesquisa):** MVP 1 usa Mercado Livre via API oficial + feeds de afiliado (a confirmar por você nos painéis da Lomadee/Awin) + cadastro manual como base universal. Scraping de grandes redes só caso a caso, com a checklist do harness — não como estratégia principal.
- **B.9 (nova):** Descoberta de lojas locais via OpenStreetMap/Overpass (grátis, cobertura variável) ou Google Places (pago, cobertura melhor) — recomendo começar pelo OSM e medir a cobertura real na sua região antes de pagar por Google Places.
- **B.10 (nova):** Cálculo de distância/rota via OSRM auto-hospedado (grátis, exige infra própria) vs. uma API paga de rotas — recomendo OSRM para o MVP, com fallback de linha reta já implementado no código.
- **B.11 (nova):** Ação prática, não técnica: você (ou alguém do time) precisa criar conta de publisher/afiliado na Lomadee e na Awin para descobrir, dentro do painel de cada uma, quais varejistas de material de construção realmente participam e oferecem feed de produto. Isso não pode ser verificado por pesquisa externa — só de dentro do painel de afiliado.

---

## 5. Risco atualizado

O maior risco deste bloco continua sendo de **negócio, não de código**: mesmo com a arquitetura pronta para plugar qualquer fonte com segurança, a cobertura real de preços — de grandes redes via afiliados e de lojas locais via cadastro do usuário — só se prova com uso real. É esperado que, no início, boa parte dos produtos fique classificada como "CINZA" (dados insuficientes, seção 17) até o sistema acumular observações suficientes. Isso não é um defeito a corrigir agora; é o comportamento correto e honesto do sistema.
