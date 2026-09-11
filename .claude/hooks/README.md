# Hooks deste projeto

Este projeto usa um **hook de git de verdade** (`.githooks/pre-commit`), não um hook do Claude Code (`.claude/settings.json` → `hooks`). Escolha deliberada: um hook do Claude Code só dispara quando o próprio Claude Code executa a ação — um hook de git roda para qualquer commit, feito por Claude Code, por outra ferramenta ou por uma pessoa direto no terminal. Como a regra que importa aqui é "nunca commitar segredo, nunca commitar código quebrado" (seção 37 do escopo mestre), o hook de git é o que realmente garante isso.

- O hook fica em `.githooks/pre-commit` (fora de `.claude/` por convenção do git, mas documentado aqui porque é conceitualmente a mesma coisa que a seção 37 do escopo mestre pede).
- Ele é ativado automaticamente por `npm install` na raiz (script `prepare` no `package.json` raiz roda `git config core.hooksPath .githooks`).
- O que ele verifica: bloqueia commit de arquivos `.env*`, bloqueia padrões que parecem credencial (chave AWS, chave privada, tokens de API conhecidos) no diff, e roda `npm run lint`/`npm run typecheck` se `node_modules` já existir.
- É deliberadamente simples (sem husky/gitleaks) para não adicionar dependência antes de precisar. Se o projeto crescer e isso não for suficiente, trocar por uma ferramenta dedicada é uma mudança pequena e isolada — não é preciso reescrever nada além deste arquivo.

Não crie hooks adicionais sem necessidade real (regra do escopo mestre: "não criar hooks excessivos").
