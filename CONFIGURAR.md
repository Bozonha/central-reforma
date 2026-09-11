# Como configurar — Mercado Livre e variáveis de ambiente

Este arquivo é o guia rápido para deixar a integração com o Mercado Livre funcionando em produção (Vercel). As outras variáveis (`DATABASE_URL`, `AUTH_SECRET`, `NOMINATIM_USER_AGENT`) já estão configuradas — este guia cobre só o que é novo.

## 1. Variáveis de ambiente novas

No painel da Vercel → seu projeto → **Settings → Environment Variables**, adicione (ambiente **Production**, e também **Preview** se quiser testar em branches):

| Variável | O que é |
|---|---|
| `MERCADOLIVRE_CLIENT_ID` | O "App ID" do seu aplicativo, do [painel de developers do Mercado Livre](https://developers.mercadolivre.com.br/devcenter) |
| `MERCADOLIVRE_CLIENT_SECRET` | A "Secret Key" do mesmo aplicativo — nunca comitar isso no repositório |
| `MERCADOLIVRE_REDIRECT_URI` | `https://SEU-DOMINIO/api/integracoes/mercado-livre/callback` (troque `SEU-DOMINIO` pelo domínio real do deploy, ex.: `https://central-reforma-web-v9br-pi.vercel.app`) |

**Importante:** o valor de `MERCADOLIVRE_REDIRECT_URI` precisa ser **idêntico, caractere por caractere**, ao que está cadastrado no painel do Mercado Livre (aba do seu app → "URLs de redirect"). Se não bater exatamente, a autorização falha com `invalid_client` ou a tela "Sorry, the application cannot connect to your account".

Depois de adicionar as variáveis, redeploy o projeto na Vercel (ou aguarde o próximo push — a Vercel builda de novo automaticamente).

## 2. Cadastre o redirect URI no app do Mercado Livre

1. Entre em [developers.mercadolivre.com.br/devcenter](https://developers.mercadolivre.com.br/devcenter) com a conta que criou o app.
2. Abra o seu aplicativo → **Editar**.
3. Em "URLs de redirect", adicione exatamente o mesmo valor de `MERCADOLIVRE_REDIRECT_URI` acima.
4. Salve.

## 3. Conecte a conta

1. Acesse o app já em produção, faça login, vá em **Compras → Mercado & preços**.
2. No card "Mercado Livre", clique em **Conectar**.
3. Você será redirecionado para o Mercado Livre, loga com a conta que vai autorizar o app (precisa ser a conta **administradora**, não um colaborador/operador — senão dá erro `invalid_operator_user_id`).
4. Depois de autorizar, você volta para `/compras` com o card mostrando "Conectado".

O que acontece por trás:
- O app troca o `code` recebido por um `access_token` (válido 6h) e um `refresh_token` (válido 6 meses, uso único).
- Isso fica guardado na tabela `mercado_livre_token` do banco (Neon/Postgres) — uma linha só, para o app inteiro, não por usuário do Central de Reforma.
- Toda busca renova o token sozinha quando ele está perto de expirar (`obterAccessTokenValido` em `apps/web/lib/mercado/mercadolivre/client.ts`). Se o refresh falhar (ex.: os 6 meses passaram, ou a autorização foi revogada no painel do Mercado Livre), a busca simplesmente avisa "conexão expirou — reconecte" — nunca inventa um preço.

## 4. Usar a busca

Ainda em **Compras → Mercado & preços**, com a conexão ativa: escolha um produto do seu catálogo, digite o que procurar (ex.: "porcelanato acetinado 60x60"), clique em Buscar. Os resultados vêm direto da API pública do Mercado Livre (preço, título, link do anúncio). Clique em "Importar como oferta" no resultado que quiser — isso grava uma oferta real (com proveniência: fonte, URL, data) e alimenta o histórico de preço/comparador de custo efetivo que já existe na página.

## 5. Sobre Leroy Merlin, C&C e outras grandes redes "direto do site"

Isso **não foi implementado como scraper**, de propósito, e não é uma limitação de código — é uma restrição real que já estava documentada em `docs/product/decisao-fontes-de-mercado.md` antes desta sessão, e que eu reconfirmei ao vivo agora:

- **Leroy Merlin**: o `robots.txt` deles proíbe explicitamente rastrear páginas de produto, e o site bloqueia ativamente acesso automatizado (confirmei agora — até uma tentativa de leitura simples do `robots.txt` levou 403).
- **C&C** (`cec.com.br`): o certificado HTTPS do servidor deles está com a cadeia quebrada — não dá pra nem abrir uma conexão segura e verificada com o site pra checar a política deles, quanto mais fazer scraping com segurança.
- Regra do projeto (`CLAUDE.md`, item 5): um scraper só pode existir depois de uma checklist de conformidade (robots.txt + Termos de Uso revisados por uma pessoa, taxa de requisição definida) — não é algo que o código deveria decidir sozinho, e neste caso a checklist reprova as duas de cara.

**O caminho real para cobrir essas redes** é o Mercado Livre mesmo: a Leroy Merlin, a C&C e a maioria das grandes redes de material de construção também vendem (direto ou via revendedores autorizados) dentro do marketplace do Mercado Livre — então a busca que você acabou de conectar já alcança boa parte desse preço, de forma 100% legítima.

Se no futuro você quiser adicionar uma rede específica via feed de afiliado (Awin/Lomadee — caminho recomendado no documento de decisão) ou via scraping onde o robots.txt/Termos permitirem, o padrão já existe pronto para isso em `docs/agents/market-engine-spike/compliant-source-harness.ts`: um scraper literalmente não consegue ser instanciado sem a checklist preenchida e aprovada — é só me pedir, apontando o site, que eu verifico a política dele antes de escrever qualquer código.

## 6. O que ainda depende de você (não é código)

- Registrar conta de publisher na Lomadee e/ou Awin, se quiser feeds de afiliado de redes específicas (decisão B.11 do documento de decisão) — isso só é visível de dentro do painel de cada rede, ninguém consegue verificar de fora.
- RLS (Row-Level Security) no Postgres ainda não foi aplicado — só existe checagem na aplicação hoje. As policies já estão esboçadas em `packages/database/prisma/rls-notes.sql`, mas aplicá-las é trabalho pendente (documentado em `apps/web/lib/auth/obra-access.ts`).
