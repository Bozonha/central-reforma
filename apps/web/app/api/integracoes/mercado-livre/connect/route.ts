import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "../../../../../lib/auth/actions";
import { mercadoLivreConfigurado, montarUrlAutorizacao } from "../../../../../lib/mercado/mercadolivre/client";

const STATE_COOKIE = "ml_oauth_state";

/**
 * Passo 1 do fluxo OAuth2 "Server side" do Mercado Livre — redireciona para
 * a tela de autorização deles. O `state` protege contra CSRF: gerado aqui,
 * guardado num cookie de curta duração, e conferido no callback.
 */
export async function GET(request: NextRequest) {
  await requireSession();

  if (!mercadoLivreConfigurado()) {
    return NextResponse.redirect(new URL("/compras?ml=sem_configuracao", request.url));
  }

  const state = crypto.randomUUID();
  const url = montarUrlAutorizacao(state);
  if (!url) {
    return NextResponse.redirect(new URL("/compras?ml=sem_configuracao", request.url));
  }

  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(url);
}
