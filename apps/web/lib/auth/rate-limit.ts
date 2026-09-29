/**
 * Rate limiting de login, contado no Postgres (ver comentário na definição
 * de `loginTentativas` em packages/database/src/schema.ts): o app roda em
 * funções serverless na Vercel, então um contador em memória do processo
 * não protegeria nada em produção — cada invocação pode cair numa instância
 * diferente, sem estado compartilhado.
 *
 * Limite pensado para não travar um usuário legítimo que erra a senha
 * algumas vezes, mas bloquear um ataque de força bruta automatizado.
 */
import "server-only";
import { db, schema } from "@central-reforma/database";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";

const JANELA_MS = 15 * 60 * 1000; // 15 minutos
const LIMITE_TENTATIVAS = 8; // por identificador (e-mail OU IP) dentro da janela

export interface StatusRateLimit {
  bloqueado: boolean;
}

/** IP do requisitante, a partir do header que a Vercel garante em produção.
 * Fora da Vercel (dev local), cai para "desconhecido" — nesse caso o rate
 * limit por e-mail ainda funciona normalmente, só o por-IP fica sem efeito
 * (todo mundo cai no mesmo balde "ip:desconhecido"). */
export async function obterIpRequisicao(): Promise<string> {
  const store = await headers();
  const encaminhado = store.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]!.trim();
  const real = store.get("x-real-ip");
  if (real) return real.trim();
  return "desconhecido";
}

async function contarTentativas(identificador: string, desde: Date): Promise<number> {
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.loginTentativas)
    .where(and(eq(schema.loginTentativas.identificador, identificador), gt(schema.loginTentativas.tentativaEm, desde)));
  return linha?.total ?? 0;
}

export async function verificarRateLimitLogin(identificadores: string[]): Promise<StatusRateLimit> {
  const desde = new Date(Date.now() - JANELA_MS);
  const contagens = await Promise.all(identificadores.map((id) => contarTentativas(id, desde)));
  return { bloqueado: contagens.some((c) => c >= LIMITE_TENTATIVAS) };
}

export async function registrarTentativaFalha(identificadores: string[]): Promise<void> {
  await db.insert(schema.loginTentativas).values(identificadores.map((identificador) => ({ identificador })));

  // Limpeza oportunista (best-effort, não derruba o login se falhar):
  // sem isso a tabela cresceria sem limite. ~2% de chance por tentativa é
  // suficiente para manter o tamanho sob controle sem um cron dedicado.
  // Feita com `await` (em vez de disparar e esquecer) porque a função
  // serverless pode ser encerrada assim que o handler retorna, o que
  // deixaria uma promise "solta" sem garantia de terminar.
  if (Math.random() < 0.02) {
    const antesDe = new Date(Date.now() - JANELA_MS * 4);
    try {
      await db.delete(schema.loginTentativas).where(lt(schema.loginTentativas.tentativaEm, antesDe));
    } catch {
      // Best-effort: uma falha aqui não deve impedir o registro da tentativa.
    }
  }
}
