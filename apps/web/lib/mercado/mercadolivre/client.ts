/**
 * Integração oficial com o Mercado Livre (decisão B.4 de
 * docs/product/decisao-fontes-de-mercado.md: "MVP 1 usa Mercado Livre via
 * API oficial registrada"). OAuth2 Authorization Code (server side),
 * documentado em developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
 * — verificado ao vivo antes de escrever este arquivo, não copiado de
 * memória de treinamento (a busca pública sem token retorna 403 hoje, então
 * TODA chamada aqui exige um access_token válido).
 *
 * Nada aqui é scraping: são chamadas à API pública e documentada do
 * Mercado Livre, dentro dos Termos de Uso de um app registrado. Isso é
 * exatamente o padrão `OfficialApiOfferSource` de
 * docs/agents/market-engine-spike/compliant-source-harness.ts, promovido
 * para código de produção.
 *
 * Regra de proveniência (CLAUDE.md #1/#2): se a chamada falhar por qualquer
 * motivo (rede, token expirado sem refresh válido, HTTP de erro), a função
 * retorna null/erro explícito — nunca um preço inventado.
 */
import { db, schema } from "@central-reforma/database";
import { desc, eq } from "drizzle-orm";

const AUTH_BASE = "https://auth.mercadolivre.com.br";
const API_BASE = "https://api.mercadolibre.com";

interface MercadoLivreConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function mercadoLivreConfig(): MercadoLivreConfig | null {
  const clientId = process.env.MERCADOLIVRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function mercadoLivreConfigurado(): boolean {
  return mercadoLivreConfig() !== null;
}

export function montarUrlAutorizacao(state: string): string | null {
  const config = mercadoLivreConfig();
  if (!config) return null;
  const url = new URL(`${AUTH_BASE}/authorization`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
}

async function salvarToken(token: TokenResponse): Promise<void> {
  const expiraEm = new Date(Date.now() + token.expires_in * 1000);
  const [existente] = await db.select().from(schema.mercadoLivreToken).limit(1);
  if (existente) {
    await db
      .update(schema.mercadoLivreToken)
      .set({
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiraEm,
        usuarioMlId: String(token.user_id),
      })
      .where(eq(schema.mercadoLivreToken.id, existente.id));
  } else {
    await db.insert(schema.mercadoLivreToken).values({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiraEm,
      usuarioMlId: String(token.user_id),
    });
  }
}

/** Troca o `code` recebido no callback OAuth por um access_token + refresh_token. */
export async function trocarCodePorToken(code: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const config = mercadoLivreConfig();
  if (!config) return { ok: false, erro: "Integração com Mercado Livre não configurada (variáveis de ambiente ausentes)." };

  try {
    const res = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const corpo = await res.text();
      return { ok: false, erro: `Mercado Livre recusou a autorização (HTTP ${res.status}): ${corpo.slice(0, 300)}` };
    }

    const token = (await res.json()) as TokenResponse;
    await salvarToken(token);
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Falha de rede ao conectar com o Mercado Livre." };
  }
}

async function renovarToken(refreshToken: string): Promise<TokenResponse | null> {
  const config = mercadoLivreConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as TokenResponse;
  } catch {
    return null;
  }
}

/**
 * Retorna um access_token utilizável, renovando via refresh_token quando
 * necessário (o refresh_token é de uso único — a renovação grava um novo por
 * cima do anterior, ver nota do Mercado Livre sobre isso). Retorna null se a
 * integração nunca foi conectada ou se a renovação falhar (nunca inventa um
 * token).
 */
export async function obterAccessTokenValido(): Promise<string | null> {
  const [registro] = await db.select().from(schema.mercadoLivreToken).orderBy(desc(schema.mercadoLivreToken.atualizadoEm)).limit(1);
  if (!registro) return null;

  const expiraEmBreve = registro.expiraEm.getTime() - Date.now() < 60_000;
  if (!expiraEmBreve) return registro.accessToken;

  const novoToken = await renovarToken(registro.refreshToken);
  if (!novoToken) return null;

  await salvarToken(novoToken);
  return novoToken.access_token;
}

export async function statusConexaoMercadoLivre(): Promise<{ conectado: boolean; atualizadoEm: Date | null }> {
  const [registro] = await db.select().from(schema.mercadoLivreToken).orderBy(desc(schema.mercadoLivreToken.atualizadoEm)).limit(1);
  return { conectado: Boolean(registro), atualizadoEm: registro?.atualizadoEm ?? null };
}

// ---------------------------------------------------------------------------
// Busca de produtos — site MLB (Brasil). Requer token válido: a busca
// pública sem autenticação retorna HTTP 403 hoje (verificado ao vivo).
// ---------------------------------------------------------------------------

export interface ResultadoBuscaMercadoLivre {
  mlId: string;
  titulo: string;
  precoCent: number;
  permalink: string;
  thumbnail: string | null;
  condicao: string | null;
}

export type BuscaMercadoLivreResultado =
  | { ok: true; resultados: ResultadoBuscaMercadoLivre[] }
  | { ok: false; motivo: "nao_conectado" | "erro" | "sem_configuracao"; detalhe?: string };

export async function buscarProdutosMercadoLivre(query: string): Promise<BuscaMercadoLivreResultado> {
  if (!mercadoLivreConfigurado()) return { ok: false, motivo: "sem_configuracao" };

  const accessToken = await obterAccessTokenValido();
  if (!accessToken) return { ok: false, motivo: "nao_conectado" };

  try {
    const url = new URL(`${API_BASE}/sites/MLB/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "10");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return { ok: false, motivo: "erro", detalhe: `HTTP ${res.status} ao buscar no Mercado Livre.` };
    }

    const dados = (await res.json()) as {
      results: {
        id: string;
        title: string;
        price: number;
        permalink: string;
        thumbnail?: string;
        condition?: string;
      }[];
    };

    return {
      ok: true,
      resultados: dados.results.map((r) => ({
        mlId: r.id,
        titulo: r.title,
        precoCent: Math.round(r.price * 100),
        permalink: r.permalink,
        thumbnail: r.thumbnail ?? null,
        condicao: r.condition ?? null,
      })),
    };
  } catch (err) {
    return { ok: false, motivo: "erro", detalhe: err instanceof Error ? err.message : "Falha de rede." };
  }
}
