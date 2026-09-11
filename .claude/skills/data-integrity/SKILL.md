---
name: data-integrity
description: Regra base de integridade de dados do Central de Reforma. Carregue sempre que um agente for produzir, validar ou apresentar qualquer dado que venha de fora do sistema (preço, produto, loja, fornecedor, profissional, avaliação, medida estimada por visão computacional, dado extraído de documento/OCR).
---

# Integridade de dados — regra base

Esta é a skill mais importante do projeto. Qualquer agente que toque dado externo ou incerto carrega esta skill antes de responder.

## A regra

**Nunca inventar.** Preço, loja, produto, estoque, fornecedor, profissional, avaliação, promoção, prazo, característica técnica, disponibilidade, dado de mercado — se não há fonte verificável para aquele dado específico, a resposta correta é "informação não disponível", nunca uma estimativa apresentada como fato.

## O que todo dado externo precisa carregar

- fonte (nome do site/API/documento)
- URL ou identificador da fonte
- data/hora de coleta
- localização (quando relevante — preço de material varia por região)
- tipo da fonte (API oficial, feed de afiliado, scraper com conformidade aprovada, cadastro manual do usuário, OCR de documento)
- status de verificação
- confiança
- condições da oferta (frete incluso? retirada disponível? estoque confirmado no momento da consulta?)
- quantidade de observações, quando for uma agregação (histórico de preço)

## Diferenciar tipo de medida/dado, sempre

Nunca apresentar um destes como se fosse outro:

- `CONFIRMADO` — verificado por fonte confiável ou pelo próprio usuário.
- `ESTIMADO` — calculado a partir de outros dados (ex.: área derivada de largura × comprimento informados).
- `PROVÁVEL` — inferido por IA (ex.: "provavelmente é este produto", "esta foto provavelmente mostra porcelanato").
- `DESCONHECIDO` — sem dado suficiente.

Isso vale especialmente para: medidas extraídas de foto/visão computacional, identificação de produto por matching semântico (em vez de EAN/GTIN/SKU exato), e leitura de nota fiscal por OCR.

## Exemplo correto

```
Produto: Porcelanato X
Preço: R$ 39,90/m²
Fonte: [nome da loja/API]
Coletado em: [data/hora real da coleta]
Estoque: confirmado na consulta
Status: verificado
```

## Exemplo correto quando falta confirmação

"Preço encontrado na fonte há 5 dias. Estoque atual não confirmado."

## Quando faltar um componente de cálculo (custo, logística, orçamento)

Nunca preencher com um valor assumido. A resposta correta é apontar exatamente o que falta:

"Não foi possível calcular o custo total porque [componente específico] não está disponível."

## Matching de produto — não assumir igualdade

Ao comparar produtos de fontes diferentes, priorize identificadores determinísticos nesta ordem: EAN/GTIN → SKU → fabricante+modelo → características técnicas → matching semântico/IA só como último recurso. Em caso de ambiguidade, não assuma que dois produtos são o mesmo — sinalize a ambiguidade.

## Scraping é conformidade, não "melhor esforço"

Se a fonte de um dado é um scraper, ele só existe se tiver passado por uma checklist de conformidade aprovada por uma pessoa (robots.txt permite + Termos de Uso revisados + taxa de requisição definida). Ver `docs/agents/market-engine-spike/compliant-source-harness.ts` para a implementação de referência que torna isso obrigatório em código, não apenas uma orientação.
