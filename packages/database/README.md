# @central-reforma/database

Pacote de schema **Drizzle ORM** (PostgreSQL, via `@neondatabase/serverless`,
driver `neon-http`) do Central de Reforma, rodando contra um banco **Neon
Postgres real** (projeto "Central reforma", região `aws-sa-east-1`).

> **Este pacote já foi Prisma 7.** Foi reescrito para Drizzle porque a CLI do
> Prisma 7 (`generate`/`migrate`) precisa baixar um binário auxiliar de
> `binaries.prisma.sh`, bloqueado por política de rede no ambiente onde isso
> foi construído (403, sem chance de retry). Drizzle + `neon-http` não
> depende de nenhum binário nativo — só HTTPS puro — então funciona em
> qualquer ambiente com saída de rede padrão. Não é motivo para voltar a
> trocar o ORM a menos que surja um motivo novo e real.

## Escopo do schema

20 tabelas, cobrindo todos os módulos do produto (não só o MVP 0):
`usuarios`, `obras`, `ambientes`, `obraColaboradores`, `produtos`, `lojas`,
`ofertas`, `priceObservations`, `itensListaCompras`, `compras`,
`itensEstoque`, `linhasOrcamento`, `tarefas`, `tarefaDependencias`,
`documentos`, `diarioEntradas`, `fotos`, `problemas`, `decisoes`, `alertas`.

Definidas em `src/schema.ts`. Convenções:

- Toda tabela tem `id` (`text`, UUID gerado em código via
  `crypto.randomUUID()`) e `criadoEm` (`timestamp`, default `now()`).
- **Dinheiro é sempre inteiro em centavos** (colunas com sufixo `Cent`) —
  nunca `float`/`real`. Ver `packages/domain/src/money.ts` para
  `reaisToCents`/`centsToBRL`.
- Enums são `text()` com validação na camada Zod (`apps/web/lib/validation/*`)
  e nos tipos compartilhados de `packages/domain/src/types.ts` — Postgres
  não força o valor no nível da coluna, a validação é de aplicação.

### Colaboração por obra (decisão "B.5")

`Obra` **não tem coluna de dono**. O dono é, por convenção, o primeiro
`obraColaboradores` daquela obra com `papel = DONO` (criado atomicamente
junto com a obra em `lib/obras/actions.ts::criarObra`). Todo acesso a dados
de uma obra passa por `requireObraAccess(usuarioId, obraId, papelMinimo)`
(`apps/web/lib/auth/obra-access.ts`) — nunca uma checagem de "dono" direta.

### Row-Level Security (ainda não ativo)

RLS no Postgres como segunda camada de isolamento (além da checagem em
aplicação) continua sendo o plano — agora que o banco é um Postgres real
(Neon), isso é trabalho legítimo, não mais bloqueado por falta de banco.
Esboço de política em [`prisma/rls-notes.sql`](./prisma/rls-notes.sql)
(mantido do scaffold original — ainda é só esboço em SQL puro, não uma
migration Drizzle, e precisa ser adaptado: a sintaxe de política RLS não
muda entre ORMs, só a forma como a migration é gerada/aplicada).

## Uso

```ts
import { db, schema } from "@central-reforma/database";
import { eq } from "drizzle-orm";

const obras = await db.select().from(schema.obras).where(eq(schema.obras.status, "ATIVA"));
```

O client (`src/client.ts`) é um singleton via `globalThis` (evita múltiplas
conexões em hot-reload) e lê `DATABASE_URL` do ambiente — a connection
string do pooler Neon (`...-pooler.sa-east-1.aws.neon.tech`).

## Aviso sobre acesso de rede em sandboxes restritos

O driver `@neondatabase/serverless` faz chamadas HTTPS próprias para
`api.<região>.aws.neon.tech` (a API HTTP da Neon — host diferente do pooler
usado na connection string). Em ambientes com allowlist de rede restrita,
esse host pode estar bloqueado mesmo que a connection string esteja correta
e o schema já tenha sido aplicado com sucesso (via ferramenta MCP, que não
passa por essa restrição). Sintoma: `NeonDbError: Server error (HTTP status
403): Host not in allowlist: api.<região>.aws.neon.tech`. Isso é uma
limitação do ambiente de desenvolvimento, não um bug de código — em
produção (Vercel) a rede é irrestrita e isso não acontece.

## Scripts

- `npm run generate` (`drizzle-kit generate`) — gera uma nova migration SQL
  a partir de mudanças em `src/schema.ts`, em `migrations/`.
- `npm run migrate:dev` (`drizzle-kit migrate`) — aplica migrations pendentes via
  `DATABASE_URL`. **Se a conexão TCP direta estiver bloqueada no seu
  ambiente**, aplique o SQL gerado manualmente via `mcp__Neon__run_sql` /
  `run_sql_transaction` em vez de rodar este script.
- `npm run studio` (`drizzle-kit studio`) — abre o Drizzle Studio.
