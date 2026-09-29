CREATE TABLE "auditoria_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ator_usuario_id" text NOT NULL,
	"acao" text NOT NULL,
	"alvo_usuario_id" text,
	"detalhe" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "papel" text DEFAULT 'USUARIO' NOT NULL;--> statement-breakpoint
ALTER TABLE "auditoria_log" ADD CONSTRAINT "auditoria_log_ator_usuario_id_usuarios_id_fk" FOREIGN KEY ("ator_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria_log" ADD CONSTRAINT "auditoria_log_alvo_usuario_id_usuarios_id_fk" FOREIGN KEY ("alvo_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auditoria_log_criado_em_idx" ON "auditoria_log" USING btree ("criado_em");