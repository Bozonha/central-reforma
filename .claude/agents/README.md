# Ativação incremental de agentes

Este projeto decidiu explicitamente **não** criar todos os agentes do catálogo conceitual (`docs/architecture/analise-arquitetura.md`, seção 8) de uma vez. Um agente só entra em `.claude/agents/` quando a fatia do roadmap que o justifica começa a ser implementada — criar antes disso é complexidade sem uso, exatamente o que o projeto quer evitar (ver `CLAUDE.md`, regra 8).

## Estado atual: nenhum agente ativo

O MVP 0 (fundação: CRUD de obra/ambiente, autenticação, dashboard com dados reais) é inteiramente código determinístico. Não há agente de IA para criar aqui.

## Quando cada agente entra

| Agente | Entra em | Por quê |
|---|---|---|
| `orchestrator` | MVP 1 | Só ganha papel real quando houver mais de um agente especializado para combinar (ex.: "comprar porcelanato do banheiro" → pesquisa + matching + validação + logística). |
| `market-research`, `product-matching`, `price-validation` | MVP 1 | Núcleo do Market Engine — ver `docs/product/decisao-fontes-de-mercado.md` para as fontes reais já pesquisadas antes de escrever este agente. |
| Assistente de leitura de nota fiscal/recibo | MVP 2 | Only interpreta OCR para estruturar `Compra`/estoque — sempre com confirmação humana antes de gravar valor (nunca decide sozinho). |
| `construction` | MVP 3 (opcional) | Interpretar entradas de diário/problemas. Recálculo de cronograma continua sendo código determinístico, não este agente. |
| `vision`, `document`, `price-history` (interpretação), `labor`, `alert` | MVP 4 | Só fazem sentido com volume real de dados dos MVPs anteriores. |

## Como escrever um agente quando chegar a hora

- Escopo mínimo: objetivo, dados necessários, regras relevantes (aponte para a skill certa em `.claude/skills/`), formato de saída esperado. Não injete o app inteiro como contexto.
- Todo agente que toca dado externo carrega a skill `data-integrity` (já existe, ver `.claude/skills/data-integrity/SKILL.md`) — isso não é opcional.
- Retorna resumo estruturado e curto, nunca despeja todo o raciocínio intermediário.
