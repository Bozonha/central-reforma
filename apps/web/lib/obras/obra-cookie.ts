/**
 * Nome do cookie que guarda a última obra selecionada nos módulos
 * cross-obra (Orçamento, Compras, Estoque, Cronograma, Documentos, Diário).
 * Arquivo isolado (sem `db`/`schema`) de propósito: é importado tanto por
 * código de servidor (lib/obras/selecionar.ts) quanto por componentes
 * cliente (obra-selector.tsx, app-shell.tsx) — puxar a constante de
 * selecionar.ts arrastaria `@central-reforma/database` para o bundle do
 * cliente.
 *
 * Não é dado sensível: o cookie só guarda "qual obra mostrar por padrão" —
 * o acesso de verdade continua checado no servidor via `requireObraAccess`
 * em toda leitura/escrita, então um valor adulterado no cliente não dá
 * acesso a nada, só faz cair de volta na primeira obra do usuário.
 */
export const OBRA_COOKIE_NAME = "cr_obra_ativa";
export const OBRA_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 dias

/**
 * Nome do CustomEvent disparado no `window` sempre que a obra ativa muda
 * (ver `setObraAtivaCookie` em obra-cookie-client.ts). A barra lateral
 * escuta esse evento para atualizar os links sem depender de hooks de
 * navegação do Next (evita a exigência de Suspense boundary do
 * `useSearchParams` só para isso).
 */
export const OBRA_ATIVA_EVENT = "cr:obra-ativa-mudou";
