import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "../../../../../lib/auth/actions";
import { trocarCodePorToken } from "../../../../../lib/mercado/mercadolivre/client";

const STATE_COOKIE = "ml_oauth_state";

/**
 * Passo 2 do fluxo OAuth2: o Mercado Livre chama esta URL de volta com
 * `code` (a ser trocado por um access_token) e o `state` que enviamos —
 * conferido contra o cookie do passo anterior antes de aceitar o code.
 * Esta URL precisa estar cadastrada, EXATAMENTE igual, como redirect_uri do
 * app no painel de developers do Mercado Livre.
 */
export async function GET(request: NextRequest) {
  await requireSession();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const erroAutorizacao = searchParams.get("error");

  const store = await cookies();
  const stateEsperado = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);

  if (erroAutorizacao) {
    return NextResponse.redirect(new URL(`/compras?ml=erro&detalhe=${encodeURIComponent(erroAutorizacao)}`, request.url));
  }

  if (!code || !state || !stateEsperado || state !== stateEsperado) {
    return NextResponse.redirect(new URL("/compras?ml=estado_invalido", request.url));
  }

  const resultado = await trocarCodePorToken(code);
  if (!resultado.ok) {
    return NextResponse.redirect(new URL(`/compras?ml=erro&detalhe=${encodeURIComponent(resultado.erro)}`, request.url));
  }

  return NextResponse.redirect(new URL("/compras?ml=conectado", request.url));
}
