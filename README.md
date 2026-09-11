# Central de Reforma

"Sistema Operacional da Reforma" — plataforma para planejar, pesquisar, comprar, organizar e acompanhar uma reforma do início ao fim.

Este repositório é gerado a partir da análise de arquitetura em `docs/architecture/`. Antes de mexer em qualquer módulo, leia `CLAUDE.md` — ele contém as regras persistentes do projeto (o que é código determinístico, o que é IA, como carregar contexto, o que nunca inventar).

## Estrutura

```
apps/web        — Next.js (UI + API via Route Handlers/Server Actions)
packages/database — schema Prisma + client
packages/domain    — regras de negócio determinísticas (sem dependência de framework)
packages/ui        — design system compartilhado
packages/shared    — tipos e utilitários compartilhados
docs/              — arquitetura, produto, dados, agentes (histórico de decisões)
.claude/           — configuração para Claude Code (agentes, skills, hooks)
```

## Status

MVP 0 (fundação) em andamento. Ver `docs/product/roadmap.md` para as fatias e o que já está pronto.

## Como rodar

```bash
npm install
npm run build
npm run dev
```

Requer Node >= 20.
