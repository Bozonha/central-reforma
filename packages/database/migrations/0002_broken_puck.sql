CREATE TABLE "mercado_livre_token" (
	"id" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expira_em" timestamp NOT NULL,
	"usuario_ml_id" text,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
