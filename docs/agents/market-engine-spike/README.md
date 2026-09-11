# Market Engine — spike de referência (não integrado)

Os dois arquivos `.ts` desta pasta foram escritos durante a análise de arquitetura, para validar o desenho do Market Engine antes de o MVP 1 existir. Eles **não são um pacote do workspace** e **não estão conectados a nenhum app** — são referência para quando o MVP 1 (mercado) começar a ser implementado.

- `compliant-source-harness.ts` — a interface `OfferSource` (fonte de oferta) e o `ComplianceRecord`: um scraper só pode ser instanciado depois de uma checklist de conformidade (robots.txt + Termos de Uso revisados por uma pessoa) estar completa. Ver `docs/product/decisao-fontes-de-mercado.md` para o contexto completo.
- `distance-cost.ts` — descoberta de lojas locais (interface plugável) e cálculo determinístico de custo efetivo com deslocamento (combustível/pedágio/estacionamento), estendendo o Motor de Logística da seção 16 do escopo mestre.

Ambos foram validados apenas por checagem de tipos (`tsc --noEmit`), nunca executados contra um site/API real — ver a ressalva em `docs/product/decisao-fontes-de-mercado.md`. Antes de promover isto a um pacote real (`packages/market-engine` ou similar), valide contra dados reais.
