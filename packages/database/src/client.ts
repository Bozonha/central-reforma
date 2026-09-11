// Client Drizzle / Neon (Postgres serverless via HTTPS — @neondatabase/serverless).
// Ver cabeçalho de src/schema.ts para o histórico completo da decisão de
// banco (Prisma → SQLite temporário → Postgres real via Neon).
//
// Em desenvolvimento, o hot-reload do Node/Next recarregaria este módulo a
// cada mudança de arquivo, o que recriaria o client a cada reload caso ele
// fosse instanciado diretamente no topo do módulo sem cache. Por isso a
// instância fica em `globalThis`, que sobrevive ao hot-reload dentro do
// mesmo processo.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL nao definida. Configure a variavel de ambiente com a connection string do Neon (ver .env.example).",
    );
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export * as schema from "./schema";
export default db;
