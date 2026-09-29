CREATE TABLE "login_tentativas" (
	"id" text PRIMARY KEY NOT NULL,
	"identificador" text NOT NULL,
	"tentativa_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "login_tentativas_identificador_tentativa_idx" ON "login_tentativas" USING btree ("identificador","tentativa_em");