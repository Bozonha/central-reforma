# .claude/ — estado atual

- `agents/README.md` — plano de ativação incremental. Nenhum agente existe ainda de propósito (MVP 0 não precisa de IA).
- `skills/data-integrity/SKILL.md` — a única skill que existe por enquanto, porque é a regra base que qualquer agente futuro vai carregar.
- `hooks/README.md` — explica por que a validação de pre-commit é um hook de git real (`.githooks/pre-commit`), não um hook do Claude Code.
- Não há `settings.json` ainda — não criamos configuração especulativa sem uma necessidade concreta. Adicione quando houver uma razão real (ex.: restringir uma ferramenta específica).
- `.mcp.json` (na raiz do repo, não aqui dentro) — recomenda o MCP do Context7 para documentação atualizada de bibliotecas durante o desenvolvimento. É o único MCP configurado de propósito: o projeto decidiu não instalar múltiplos MCPs sem benefício comprovado (ver `docs/architecture/analise-arquitetura.md`, seção 8.3).
