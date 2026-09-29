/**
 * Rate limiting de ações sensíveis de autenticação (login, pedido de
 * redefinição de senha), contado no Postgres (ver comentário na definição
 * de `loginTentativas` em packages/database/src/schema.ts): o app roda em
 * funções serverless na Vercel, então um contador em memória do processo
 * não protegeria nada em produção — cada invocação pode cair numa instância
 * diferente, sem estado compartilhado.
 *
 * A tabela é compartilhada entre os dois usos porque a lógica é idêntica
 * (contar linhas recentes por identificador); o `identificador` é
 * prefixado por chamador ("login:email:…", "resetreq:ip:…") para que os
 * limites não se misturem entre ações diferentes.
 */
import "server-only";
import { db, schema } from "@central-reforma/database";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";

const JANELA_PADRAO_MS = 15 * 60 * 1000; // 15 minutos
const LIMITE_PADRAO = 8; // por identificador (e-mail OU IP) dentro da janela

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

/** Base da URL da aplicação a partir dos headers da requisição — evita
 * precisar de mais uma variável de ambiente (tipo NEXT_PUBLIC_APP_URL) só
 * para montar links absolutos em e-mails transacionais. */
export async function obterBaseUrl(): Promise<string> {
  const store = await headers();
  const proto = store.get("x-forwarded-proto") ?? "https";
  const host = store.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function contarTentativas(identificador: string, desde: Date): Promise<number> {
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.loginTentativas)
    .where(and(eq(schema.loginTentativas.identificador, identificador), gt(schema.loginTentativas.tentativaEm, desde)));
  return linha?.total ?? 0;
}

export async function verificarRateLimit(
  identificadores: string[],
  opts: { limite?: number; janelaMs?: number } = {},
): Promise<StatusRateLimit> {
  const limite = opts.limite ?? LIMITE_PADRAO;
  const janelaMs = opts.janelaMs ?? JANELA_PADRAO_MS;
  const desde = new Date(Date.now() - janelaMs);
  const contagens = await Promise.all(identificadores.map((id) => contarTentativas(id, desde)));
  return { bloqueado: contagens.some((c) => c >= limite) };
}

export async function registrarTentativa(identificadores: string[]): Promise<void> {
  await db.insert(schema.loginTentativas).values(identificadores.map((identificador) => ({ identificador })));

  // Limpeza oportunista (best-effort, não derruba o fluxo se falhar): sem
  // isso a tabela cresceria sem limite. ~2% de chance por tentativa é
  // suficiente para manter o tamanho sob controle sem um cron dedicado.
  // Feita com `await` (em vez de disparar e esquecer) porque a função
  // serverless pode ser encerrada assim que o handler retorna, o que
  // deixaria uma promise "solta" sem garantia de terminar.
  if (Math.random() < 0.02) {
    const antesDe = new Date(Date.now() - JANELA_PADRAO_MS * 8);
    try {
      await db.delete(schema.loginTentativas).where(lt(schema.loginTentativas.tentativaEm, antesDe));
    } catch {
      // Best-effort: uma falha aqui não deve impedir o registro da tentativa.
    }
  }
}
