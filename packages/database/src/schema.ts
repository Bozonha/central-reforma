// Central de Reforma — schema Drizzle ORM / PostgreSQL (Neon).
//
// HISTÓRICO: o ORM deste pacote era Prisma 7, trocado para Drizzle porque
// `prisma generate`/`migrate` dependem de um binário baixado de
// binaries.prisma.sh, bloqueado pela política de rede do ambiente onde o
// código foi construído (ver docs/product/decisoes.md). O banco passou por
// SQLite local como ponte temporária (dado real, mas sem depender de conta
// externa) e agora está em **Postgres real via Neon** — o dono do produto
// criou a conta e conectou o projeto "Central reforma" nesta sessão, então
// não há mais razão para o degrau intermediário do SQLite. Isso cumpre a
// decisão B.3 (Vercel + Neon).
//
// Regra de integridade (CLAUDE.md #2/#3): todo valor monetário é armazenado
// como inteiro em CENTAVOS (nunca float aproximado). Conversão para R$ é
// responsabilidade de packages/domain/src/money.ts.
//
// RLS (Row-Level Security): agora que o banco é Postgres de verdade, as
// políticas esboçadas em prisma/rls-notes.sql podem ser aplicadas como
// segunda camada de isolamento (além da checagem em
// apps/web/lib/auth/obra-access.ts). Isso ainda não foi feito nesta etapa —
// ver docs/product/roadmap.md.

import { pgTable, text, integer, real, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("criado_em", { mode: "date" }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// Identidade e colaboração
// ---------------------------------------------------------------------------

export const usuarios = pgTable("usuarios", {
  id: id(),
  email: text("email").notNull(),
  nome: text("nome").notNull(),
  senhaHash: text("senha_hash").notNull(),
  criadoEm: createdAt(),
}, (t) => [uniqueIndex("usuarios_email_idx").on(t.email)]);

export const obras = pgTable("obras", {
  id: id(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  status: text("status").notNull().default("ATIVA"),
  orcamentoTotalCent: integer("orcamento_total_cent"),
  dataInicio: timestamp("data_inicio", { mode: "date" }),
  dataFimPrevista: timestamp("data_fim_prevista", { mode: "date" }),
  observacoes: text("observacoes"),

  logradouro: text("logradouro"),
  cidade: text("cidade"),
  estado: text("estado"),
  cep: text("cep"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  geocodificadoEm: timestamp("geocodificado_em", { mode: "date" }),

  // Perfil de deslocamento (packages/domain/src/logistics.ts) — usado para
  // calcular o custo efetivo de uma oferta com retirada local (preço +
  // combustível + pedágio + estacionamento). Sempre informado pelo usuário,
  // nunca estimado: se algum destes faltar, o cálculo diz explicitamente o
  // que falta em vez de assumir um valor (CLAUDE.md #1).
  combustivelPrecoLitroCent: integer("combustivel_preco_litro_cent"),
  veiculoKmPorLitro: real("veiculo_km_por_litro"),
  pedagioCent: integer("pedagio_cent"),
  estacionamentoCent: integer("estacionamento_cent"),

  criadoEm: createdAt(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow().$onUpdateFn(() => new Date()),
});

export const ambientes = pgTable("ambientes", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  largura: real("largura"),
  comprimento: real("comprimento"),
  altura: real("altura"),
  fonteMedida: text("fonte_medida").notNull().default("USUARIO"),
  observacoes: text("observacoes"),
  criadoEm: createdAt(),
});

export const obraColaboradores = pgTable("obra_colaboradores", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id),
  papel: text("papel").notNull(),
  convidadoPorId: text("convidado_por_id").references(() => usuarios.id),
  convidadoEm: createdAt(),
  aceitoEm: timestamp("aceito_em", { mode: "date" }),
}, (t) => [uniqueIndex("obra_colaboradores_obra_usuario_idx").on(t.obraId, t.usuarioId)]);

// ---------------------------------------------------------------------------
// Mercado
// ---------------------------------------------------------------------------

export const produtos = pgTable("produtos", {
  id: id(),
  nome: text("nome").notNull(),
  categoria: text("categoria"),
  marca: text("marca"),
  modelo: text("modelo"),
  unidade: text("unidade").notNull(),
  criadoEm: createdAt(),
});

export const lojas = pgTable("lojas", {
  id: id(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  logradouro: text("logradouro"),
  cidade: text("cidade"),
  estado: text("estado"),
  cep: text("cep"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  fonte: text("fonte").notNull(),
  fonteId: text("fonte_id"),
  capturadoEm: createdAt(),
});

export const ofertas = pgTable("ofertas", {
  id: id(),
  produtoId: text("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  lojaId: text("loja_id").notNull().references(() => lojas.id, { onDelete: "cascade" }),
  precoCent: integer("preco_cent").notNull(),
  unidade: text("unidade").notNull(),
  freteCent: integer("frete_cent"),
  fonte: text("fonte").notNull().default("MANUAL"),
  fonteUrl: text("fonte_url"),
  confianca: text("confianca").notNull().default("CONFIRMADO"),
  capturadoEm: createdAt(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Append-only: nunca é atualizado, só inserido.
export const priceObservations = pgTable("price_observations", {
  id: id(),
  produtoId: text("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  lojaId: text("loja_id").references(() => lojas.id),
  precoCent: integer("preco_cent").notNull(),
  fonte: text("fonte").notNull(),
  fonteUrl: text("fonte_url"),
  capturadoEm: createdAt(),
});

/**
 * Credenciais OAuth2 da integração oficial com o Mercado Livre (decisão B.4
 * — "MVP 1 usa Mercado Livre via API oficial"). Uma única linha para o app
 * inteiro (não é por usuário do Central de Reforma): quem conecta é o app,
 * usando o client_id/client_secret cadastrados no portal de developers do
 * Mercado Livre (env vars, nunca no código). O refresh_token é de uso único
 * — cada renovação grava um novo por cima do anterior (lib/mercado/mercadolivre/client.ts).
 */
export const mercadoLivreToken = pgTable("mercado_livre_token", {
  id: id(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiraEm: timestamp("expira_em", { mode: "date" }).notNull(),
  usuarioMlId: text("usuario_ml_id"),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// ---------------------------------------------------------------------------
// Compras, estoque, orçamento
// ---------------------------------------------------------------------------

export const itensListaCompras = pgTable("itens_lista_compras", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  ambienteId: text("ambiente_id").references(() => ambientes.id),
  produtoId: text("produto_id").references(() => produtos.id),
  nomeLivre: text("nome_livre"),
  quantidadeNecessaria: real("quantidade_necessaria").notNull(),
  quantidadeComprada: real("quantidade_comprada").notNull().default(0),
  prioridade: text("prioridade").notNull().default("MEDIA"),
  etapa: text("etapa"),
  status: text("status").notNull().default("PENDENTE"),
  criadoEm: createdAt(),
});

export const compras = pgTable("compras", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  itemListaComprasId: text("item_lista_compras_id").references(() => itensListaCompras.id),
  produtoId: text("produto_id").references(() => produtos.id),
  lojaId: text("loja_id").references(() => lojas.id),
  nomeLivre: text("nome_livre"),
  quantidade: real("quantidade").notNull(),
  precoUnitarioCent: integer("preco_unitario_cent").notNull(),
  valorTotalCent: integer("valor_total_cent").notNull(),
  formaPagamento: text("forma_pagamento"),
  data: timestamp("data", { mode: "date" }).notNull().defaultNow(),
  notaFiscalDocumentoId: text("nota_fiscal_documento_id"),
  criadoEm: createdAt(),
});

export const itensEstoque = pgTable("itens_estoque", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  ambienteId: text("ambiente_id").references(() => ambientes.id),
  produtoId: text("produto_id").references(() => produtos.id),
  nomeLivre: text("nome_livre"),
  quantidade: real("quantidade").notNull(),
  unidade: text("unidade").notNull(),
  origem: text("origem").notNull().default("MANUAL"),
  documentoId: text("documento_id"),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow().$onUpdateFn(() => new Date()),
  criadoEm: createdAt(),
});

export const linhasOrcamento = pgTable("linhas_orcamento", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  ambienteId: text("ambiente_id").references(() => ambientes.id),
  categoria: text("categoria").notNull(),
  planejadoCent: integer("planejado_cent").notNull(),
  compradoCent: integer("comprado_cent").notNull().default(0),
  pagoCent: integer("pago_cent").notNull().default(0),
  criadoEm: createdAt(),
});

// ---------------------------------------------------------------------------
// Cronograma
// ---------------------------------------------------------------------------

export const tarefas = pgTable("tarefas", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  ambienteId: text("ambiente_id").references(() => ambientes.id),
  titulo: text("titulo").notNull(),
  responsavel: text("responsavel"),
  inicio: timestamp("inicio", { mode: "date" }),
  fim: timestamp("fim", { mode: "date" }),
  duracaoDias: integer("duracao_dias"),
  status: text("status").notNull().default("PENDENTE"),
  prioridade: text("prioridade").notNull().default("MEDIA"),
  percentualConclusao: integer("percentual_conclusao").notNull().default(0),
  criadoEm: createdAt(),
});

export const tarefaDependencias = pgTable("tarefa_dependencias", {
  id: id(),
  tarefaId: text("tarefa_id").notNull().references(() => tarefas.id, { onDelete: "cascade" }),
  dependeDeId: text("depende_de_id").notNull().references(() => tarefas.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("tarefa_dependencias_idx").on(t.tarefaId, t.dependeDeId)]);

// ---------------------------------------------------------------------------
// Documentos, diário, fotos, problemas, decisões, alertas
// ---------------------------------------------------------------------------

export const documentos = pgTable("documentos", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  arquivoUrl: text("arquivo_url").notNull(),
  nomeArquivo: text("nome_arquivo").notNull(),
  tamanhoBytes: integer("tamanho_bytes").notNull(),
  mimeType: text("mime_type").notNull(),
  classificacao: text("classificacao"),
  extraidoPor: text("extraido_por").notNull().default("MANUAL"),
  dataUpload: createdAt(),
});

export const diarioEntradas = pgTable("diario_entradas", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  data: timestamp("data", { mode: "date" }).notNull().defaultNow(),
  texto: text("texto").notNull(),
  criadoEm: createdAt(),
});

export const fotos = pgTable("fotos", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  ambienteId: text("ambiente_id").references(() => ambientes.id),
  diarioEntradaId: text("diario_entrada_id").references(() => diarioEntradas.id),
  url: text("url").notNull(),
  tipo: text("tipo").notNull().default("PROGRESSO"),
  criadoEm: createdAt(),
});

export const problemas = pgTable("problemas", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  ambienteId: text("ambiente_id").references(() => ambientes.id),
  descricao: text("descricao").notNull(),
  status: text("status").notNull().default("ABERTO"),
  data: createdAt(),
});

export const decisoes = pgTable("decisoes", {
  id: id(),
  obraId: text("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  contexto: text("contexto"),
  data: createdAt(),
});

export const alertas = pgTable("alertas", {
  id: id(),
  usuarioId: text("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  produtoId: text("produto_id").notNull().references(() => produtos.id, { onDelete: "cascade" }),
  precoAlvoCent: integer("preco_alvo_cent").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  ultimaVerificacao: timestamp("ultima_verificacao", { mode: "date" }),
  criadoEm: createdAt(),
});
