/**
 * Service worker mínimo — só o necessário para o app ser "instalável"
 * (Chrome/Android exige um SW com um handler de "fetch" registrado) e para
 * dar cache-first a assets estáticos versionados (JS/CSS/ícones do build,
 * em /_next/static/ e /icons/), reduzindo a espera numa rede ruim de obra.
 *
 * Deliberadamente NÃO faz cache de navegação (HTML), de rotas /api/, nem de
 * qualquer resposta dinâmica: este é um SaaS multi-usuário com dados por
 * Obra (CLAUDE.md regra 6 — isolamento entre usuários é absoluto). Um SW
 * "offline-first" ingênuo que cacheia página HTML serviria a última tela
 * vista mesmo depois de outro usuário logar no mesmo aparelho — inaceitável
 * aqui. Fora dos caminhos estáticos abaixo, o fetch nunca é interceptado:
 * o navegador vai direto à rede, com toda checagem de sessão do servidor.
 */

const CACHE_NAME = "cr-estaticos-v1";
const PREFIXOS_CACHEAVEIS = ["/_next/static/", "/icons/"];

function ehCacheavel(url) {
  if (url.origin !== self.location.origin) return false;
  return PREFIXOS_CACHEAVEIS.some((prefixo) => url.pathname.startsWith(prefixo));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!ehCacheavel(url)) return; // deixa passar direto pro navegador/servidor

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cacheada = await cache.match(event.request);
      if (cacheada) return cacheada;
      const resposta = await fetch(event.request);
      if (resposta.ok) cache.put(event.request, resposta.clone());
      return resposta;
    }),
  );
});
