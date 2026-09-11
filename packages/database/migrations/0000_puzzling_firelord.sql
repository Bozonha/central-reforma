CREATE TABLE "alertas" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"produto_id" text NOT NULL,
	"preco_alvo_cent" integer NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"ultima_verificacao" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ambientes" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"nome" text NOT NULL,
	"largura" real,
	"comprimento" real,
	"altura" real,
	"fonte_medida" text DEFAULT 'USUARIO' NOT NULL,
	"observacoes" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compras" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"item_lista_compras_id" text,
	"produto_id" text,
	"loja_id" text,
	"nome_livre" text,
	"quantidade" real NOT NULL,
	"preco_unitario_cent" integer NOT NULL,
	"valor_total_cent" integer NOT NULL,
	"forma_pagamento" text,
	"data" timestamp DEFAULT now() NOT NULL,
	"nota_fiscal_documento_id" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisoes" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"descricao" text NOT NULL,
	"contexto" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diario_entradas" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"data" timestamp DEFAULT now() NOT NULL,
	"texto" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"tipo" text NOT NULL,
	"arquivo_url" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"mime_type" text NOT NULL,
	"classificacao" text,
	"extraido_por" text DEFAULT 'MANUAL' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fotos" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"ambiente_id" text,
	"diario_entrada_id" text,
	"url" text NOT NULL,
	"tipo" text DEFAULT 'PROGRESSO' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_estoque" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"ambiente_id" text,
	"produto_id" text,
	"nome_livre" text,
	"quantidade" real NOT NULL,
	"unidade" text NOT NULL,
	"origem" text DEFAULT 'MANUAL' NOT NULL,
	"documento_id" text,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_lista_compras" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"ambiente_id" text,
	"produto_id" text,
	"nome_livre" text,
	"quantidade_necessaria" real NOT NULL,
	"quantidade_comprada" real DEFAULT 0 NOT NULL,
	"prioridade" text DEFAULT 'MEDIA' NOT NULL,
	"etapa" text,
	"status" text DEFAULT 'PENDENTE' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linhas_orcamento" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"ambiente_id" text,
	"categoria" text NOT NULL,
	"planejado_cent" integer NOT NULL,
	"comprado_cent" integer DEFAULT 0 NOT NULL,
	"pago_cent" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lojas" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"logradouro" text,
	"cidade" text,
	"estado" text,
	"cep" text,
	"latitude" real,
	"longitude" real,
	"fonte" text NOT NULL,
	"fonte_id" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obra_colaboradores" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"papel" text NOT NULL,
	"convidado_por_id" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"aceito_em" timestamp
);
--> statement-breakpoint
CREATE TABLE "obras" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"status" text DEFAULT 'ATIVA' NOT NULL,
	"orcamento_total_cent" integer,
	"data_inicio" timestamp,
	"data_fim_prevista" timestamp,
	"observacoes" text,
	"logradouro" text,
	"cidade" text,
	"estado" text,
	"cep" text,
	"latitude" real,
	"longitude" real,
	"geocodificado_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ofertas" (
	"id" text PRIMARY KEY NOT NULL,
	"produto_id" text NOT NULL,
	"loja_id" text NOT NULL,
	"preco_cent" integer NOT NULL,
	"unidade" text NOT NULL,
	"frete_cent" integer,
	"fonte" text DEFAULT 'MANUAL' NOT NULL,
	"fonte_url" text,
	"confianca" text DEFAULT 'CONFIRMADO' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"produto_id" text NOT NULL,
	"loja_id" text,
	"preco_cent" integer NOT NULL,
	"fonte" text NOT NULL,
	"fonte_url" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problemas" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"ambiente_id" text,
	"descricao" text NOT NULL,
	"status" text DEFAULT 'ABERTO' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"categoria" text,
	"marca" text,
	"modelo" text,
	"unidade" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarefa_dependencias" (
	"id" text PRIMARY KEY NOT NULL,
	"tarefa_id" text NOT NULL,
	"depende_de_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarefas" (
	"id" text PRIMARY KEY NOT NULL,
	"obra_id" text NOT NULL,
	"ambiente_id" text,
	"titulo" text NOT NULL,
	"responsavel" text,
	"inicio" timestamp,
	"fim" timestamp,
	"duracao_dias" integer,
	"status" text DEFAULT 'PENDENTE' NOT NULL,
	"prioridade" text DEFAULT 'MEDIA' NOT NULL,
	"percentual_conclusao" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"senha_hash" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambientes" ADD CONSTRAINT "ambientes_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compras" ADD CONSTRAINT "compras_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compras" ADD CONSTRAINT "compras_item_lista_compras_id_itens_lista_compras_id_fk" FOREIGN KEY ("item_lista_compras_id") REFERENCES "public"."itens_lista_compras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compras" ADD CONSTRAINT "compras_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compras" ADD CONSTRAINT "compras_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisoes" ADD CONSTRAINT "decisoes_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diario_entradas" ADD CONSTRAINT "diario_entradas_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_ambiente_id_ambientes_id_fk" FOREIGN KEY ("ambiente_id") REFERENCES "public"."ambientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_diario_entrada_id_diario_entradas_id_fk" FOREIGN KEY ("diario_entrada_id") REFERENCES "public"."diario_entradas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_estoque" ADD CONSTRAINT "itens_estoque_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_estoque" ADD CONSTRAINT "itens_estoque_ambiente_id_ambientes_id_fk" FOREIGN KEY ("ambiente_id") REFERENCES "public"."ambientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_estoque" ADD CONSTRAINT "itens_estoque_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_lista_compras" ADD CONSTRAINT "itens_lista_compras_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_lista_compras" ADD CONSTRAINT "itens_lista_compras_ambiente_id_ambientes_id_fk" FOREIGN KEY ("ambiente_id") REFERENCES "public"."ambientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_lista_compras" ADD CONSTRAINT "itens_lista_compras_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linhas_orcamento" ADD CONSTRAINT "linhas_orcamento_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linhas_orcamento" ADD CONSTRAINT "linhas_orcamento_ambiente_id_ambientes_id_fk" FOREIGN KEY ("ambiente_id") REFERENCES "public"."ambientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obra_colaboradores" ADD CONSTRAINT "obra_colaboradores_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obra_colaboradores" ADD CONSTRAINT "obra_colaboradores_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obra_colaboradores" ADD CONSTRAINT "obra_colaboradores_convidado_por_id_usuarios_id_fk" FOREIGN KEY ("convidado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problemas" ADD CONSTRAINT "problemas_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problemas" ADD CONSTRAINT "problemas_ambiente_id_ambientes_id_fk" FOREIGN KEY ("ambiente_id") REFERENCES "public"."ambientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefa_dependencias" ADD CONSTRAINT "tarefa_dependencias_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefa_dependencias" ADD CONSTRAINT "tarefa_dependencias_depende_de_id_tarefas_id_fk" FOREIGN KEY ("depende_de_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_ambiente_id_ambientes_id_fk" FOREIGN KEY ("ambiente_id") REFERENCES "public"."ambientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "obra_colaboradores_obra_usuario_idx" ON "obra_colaboradores" USING btree ("obra_id","usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tarefa_dependencias_idx" ON "tarefa_dependencias" USING btree ("tarefa_id","depende_de_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_idx" ON "usuarios" USING btree ("email");